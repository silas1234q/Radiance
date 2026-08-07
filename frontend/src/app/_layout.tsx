import { useEffect, useRef, useState } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import {
  ClerkProvider,
  ClerkLoaded,
  useAuth,
  useUser,
  useClerk,
} from "@clerk/clerk-expo";
import {
  QueryClient,
  MutationCache,
  QueryCache,
} from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import Toast from "react-native-toast-message";
import { tokenCache } from "../lib/clerk";
import { apiCall, authHeaders } from "../api/apiClient";
import { getAppState, setAppState, clearAppState } from "../lib/appStateCache";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { RevenueCatProvider } from "../providers/RevenueCatProvider";
import { NotificationsProvider } from "../providers/NotificationsProvider";
import ErrorBoundary from "../components/ErrorBoundary";
import AnimatedSplash from "../components/splash/AnimatedSplash";
import { setNavReady } from "../lib/splash/ready";
import { toastConfig } from "../components/ui/toastConfig";
import { toast } from "../lib/toast";
import {
  isBadResponseError,
  isCancelledError,
  isNetworkError,
  isTimeoutError,
  isUnauthorizedError,
} from "../lib/errors";
import { onSessionExpired, resetSessionExpiry, suppressSessionExpiry, isSessionExpirySuppressed, markAuthSettled } from "../lib/sessionExpiry";
import { persister, persistOptions } from "../lib/queryPersister";
import { registerMutationDefaults } from "../lib/mutationDefaults";
import { checkConnectivity, getIsOnline, startConnectivityWatch } from "../lib/connectivity";
import { setClerkAuth } from "../lib/authToken";
import { useColdStartGate } from "../hooks/useColdStartGate";
import "../../global.css";

// Tracks which Clerk user the persisted cache belongs to, so we only wipe it on
// an actual account change (not on every cold start for the same user).
const LAST_USER_KEY = "radiance:last-user-id";

// Hold the native splash until our JS overlay has painted, then cross-fade.
SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ duration: 300, fade: true });

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Keep cached entries long enough to persist and rehydrate offline. Must
      // be >= the persister's maxAge (see lib/queryPersister.ts).
      cacheTime: 1000 * 60 * 60 * 24 * 7, // 7 days
      // Serve cache first, still attempt the network.
      networkMode: "offlineFirst",
      retry: (failureCount, err) => {
        if (isUnauthorizedError(err)) return false; // re-auth is authedFetch's job
        if (isCancelledError(err)) return false; // we asked for this
        if (isBadResponseError(err)) return false; // deterministic — same bad body comes back
        if (isTimeoutError(err)) return false; // we already waited the full budget
        if (isNetworkError(err)) {
          // A blip deserves another try; a confirmed outage does not. Wi-Fi/cell
          // handoffs and single dropped connections are routine on mobile, and
          // failing them instantly is what produced spurious "No connection"
          // toasts. Once the probe confirms we're offline, fail fast instead so
          // screens fall back to cached data.
          if (!getIsOnline()) return false;
          return failureCount < 2;
        }
        return failureCount < 2;
      },
    },
    mutations: {
      // Fail fast rather than hang when offline. The handful of writes that are
      // *meant* to survive an outage opt into `networkMode: 'online'` (which
      // pauses + queues them) in lib/mutationDefaults.ts.
      networkMode: "offlineFirst",
    },
  },
  // Failed mutations toast by default. Opt out per-mutation with
  // `meta: { suppressErrorToast: true }` when a screen renders its own error UI.
  mutationCache: new MutationCache({
    onError: (err, _vars, _ctx, mutation) => {
      if (mutation.meta?.suppressErrorToast) return;
      if (isUnauthorizedError(err)) return;
      // A queued write that's simply waiting for a connection hasn't failed —
      // don't nag about it.
      if (mutation.state.isPaused) return;
      toast.fromError(err);
    },
  }),
  // Queries fail silently by default (screens render their own empty/error
  // states), but a network outage affects the whole app — surface a single
  // throttled toast so the user isn't left staring at a blank screen. What that
  // toast *says* is decided by `toast.fromError`, once the probe has confirmed
  // whether we're actually offline.
  queryCache: new QueryCache({
    onError: (err, query) => {
      if (isUnauthorizedError(err)) return;
      if (query.meta?.suppressErrorToast) return;
      // A background refresh that failed while the screen already shows data is
      // a non-event — the user didn't ask for it and wouldn't have noticed.
      if (query.state.data !== undefined) return;
      if (query.getObserversCount() === 0) return; // nobody's looking at this
      if (isNetworkError(err)) toast.fromError(err);
    },
  }),
});

// Must run before anything can enqueue a write, and before the persister
// restores queued writes from a previous launch — a restored mutation finds its
// `mutationFn` only through these defaults.
registerMutationDefaults(queryClient);

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error("EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is not set");
}

async function syncUserWithBackend(
  getToken: () => Promise<string | null>,
): Promise<boolean | null> {
  try {
    const token = await getToken();
    if (!token) return null;

    const data = await apiCall<{ isOnboarded?: boolean }>("/auth/sync", {
      method: "POST",
      headers: authHeaders(token),
    });
    return !!data?.isOnboarded;
  } catch {
    return null;
  }
}

function AuthRouter() {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const segments = useSegments();
  const navigatedForSignIn = useRef(false);
  const cachedNavDone = useRef(false);
  const cachedNavState = useRef<{ isSignedIn: boolean; isOnboarded: boolean } | null>(null);
  const hasEverBeenSignedIn = useRef(false);
  const coldStartTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep the module-level token registry current so the offline write queue can
  // authenticate replays from outside React.
  useEffect(() => {
    setClerkAuth(getToken, isSignedIn);
  }, [getToken, isSignedIn]);

  // Auto sign-out when the backend returns 401 (session expired)
  useEffect(() => {
    return onSessionExpired(() => {
      if (isSessionExpirySuppressed()) return;
      // Never sign anyone out over a connectivity blip — offline, Clerk can't
      // refresh its token and every request looks like a dead session.
      if (!getIsOnline()) return;
      suppressSessionExpiry();
      toast.error('Your session expired. Please sign in again.');
      queryClient.cancelQueries();
      queryClient.clear();
      signOut();
    });
  }, [signOut]);

  // Phase 1: Optimistic navigation from cache (runs once, before Clerk loads)
  useEffect(() => {
    if (cachedNavDone.current) return;
    cachedNavDone.current = true;

    (async () => {
      const cached = await getAppState();
      if (!cached) return; // no cache — fall through to blocking flow

      cachedNavState.current = { isSignedIn: cached.isSignedIn, isOnboarded: cached.isOnboarded };

      if (cached.isSignedIn && cached.isOnboarded) {
        router.replace("/(tabs)");
      } else if (cached.isSignedIn && !cached.isOnboarded) {
        // Deliberately no setNavReady() here. "Signed in but not onboarded" is
        // the one prediction that's routinely stale — it's what a brand-new
        // account cached at sign-up — so we keep the splash up and let Phase 2
        // confirm. Dropping the splash now is what showed users the quiz for a
        // second before bouncing them to the home screen.
        router.replace("/(onboarding)/quiz");
        return;
      } else {
        router.replace("/auth");
      }
      setNavReady();
    })();
  }, []);

  // Phase 2: Backend confirmation (still runs the same logic, corrects if needed)
  useEffect(() => {
    if (!isLoaded) return;
    // During sign-up, `isSignedIn` can flip to `true` before the `user` object
    // is hydrated. Wait for both so the else (signed-out) branch doesn't race
    // the sign-in navigation with cache wipes and a redirect back to /auth.
    if (isSignedIn && !user) return;

    if (isSignedIn && user) {
      hasEverBeenSignedIn.current = true;
      markAuthSettled();
      resetSessionExpiry();
      // Cancel any pending cold-start sign-out timer.
      if (coldStartTimer.current) {
        clearTimeout(coldStartTimer.current);
        coldStartTimer.current = null;
      }
      if (navigatedForSignIn.current) return;
      navigatedForSignIn.current = true;

      (async () => {
        try {
          // Only wipe the (persisted) cache when a DIFFERENT user signs in — for
          // the same user resuming, keep it so their data is available offline on
          // cold start; a background refetch updates it when online.
          const lastUserId = await AsyncStorage.getItem(LAST_USER_KEY);
          if (lastUserId !== user.id) {
            queryClient.clear();
            await persister.removeClient();
            await clearAppState();
            await AsyncStorage.setItem(LAST_USER_KEY, user.id);
          }

          const backendOnboarded = await syncUserWithBackend(getToken);
          try {
            await user.reload();
          } catch {
            // user.reload() can fail on flaky networks — continue with what we have.
          }

          const isOnboarded = backendOnboarded ?? !!user.publicMetadata?.onboarded;

          // Update the app state cache for next cold start
          await setAppState({ isSignedIn: true, isOnboarded, userId: user.id });

          // Only navigate if the real state differs from what the cache predicted,
          // or if there was no cached navigation at all.
          const cached = cachedNavState.current;
          const needsNav =
            !cached ||
            cached.isSignedIn !== true ||
            cached.isOnboarded !== isOnboarded;

          if (needsNav) {
            router.replace(isOnboarded ? "/(tabs)" : "/(onboarding)/quiz");
          }
        } catch {
          // If everything fails, still navigate — a new user goes to quiz,
          // an existing user goes to tabs based on whatever metadata we have.
          const isOnboarded = !!user.publicMetadata?.onboarded;
          router.replace(isOnboarded ? "/(tabs)" : "/(onboarding)/quiz");
        } finally {
          // Destination is mounted — let the animated splash fade out.
          setNavReady();
        }
      })();
    } else {
      // Clerk says signed out. That's only trustworthy if we can reach the
      // network — offline it can't refresh the session and reports `false` for a
      // perfectly valid account. `hadSession` covers both the cold-start case
      // (cache says they were signed in) and a mid-session blip. A deliberate
      // sign-out always sets the suppression flag first, so it skips the guard
      // and takes effect immediately.
      const hadSession =
        !isSessionExpirySuppressed() &&
        (hasEverBeenSignedIn.current || !!cachedNavState.current?.isSignedIn);

      if (hadSession) {
        // Grace period: when the app is killed and restarted, Clerk's JWT is
        // often expired and isSignedIn briefly reads `false` while the token is
        // being refreshed. Wait it out before wiping everything.
        const armGuard = () => {
          coldStartTimer.current = setTimeout(async () => {
            coldStartTimer.current = null;
            // Still nothing from Clerk. Before destroying the user's cached
            // data, make sure this isn't just an outage — otherwise a subway
            // ride ends with them signed out and their offline data gone.
            if ((await checkConnectivity()) !== "online") {
              armGuard(); // keep watching; nothing destructive while offline
              return;
            }
            hasEverBeenSignedIn.current = true; // prevent re-entering this guard
            markAuthSettled();
            navigatedForSignIn.current = false;
            suppressSessionExpiry();
            queryClient.clear();
            void persister.removeClient();
            void AsyncStorage.removeItem(LAST_USER_KEY);
            void clearAppState();
            router.replace("/auth");
          }, 10000);
        };
        if (!coldStartTimer.current) armGuard();
        // Don't wipe yet — wait for Clerk to potentially refresh.
        setNavReady();
        return;
      }

      navigatedForSignIn.current = false;
      markAuthSettled();
      // NOTE: Do NOT resetSessionExpiry() here — it races with in-flight token
      // retries that call emitSessionExpired() after sign-out, causing a spurious
      // "session expired" toast. Suppression is reset when the user signs back in.
      // Signed out: drop the cache and its persisted snapshot so it can't
      // rehydrate into the next account.
      queryClient.clear();
      void persister.removeClient();
      void AsyncStorage.removeItem(LAST_USER_KEY);
      void clearAppState();

      const cached = cachedNavState.current;
      if (!cached || cached.isSignedIn !== false) {
        if (segments[0] !== "auth") {
          router.replace("/auth");
        }
      }
      // Signed-out destination resolved (already on or navigating to /auth).
      setNavReady();
    }
  }, [isSignedIn, isLoaded, user]);

  return (
    <Stack screenOptions={{ headerShown: false }} initialRouteName="(screens)/auth">
      <Stack.Screen name="(screens)/auth" options={{ animation: "fade" }} />
      <Stack.Screen name="(onboarding)" options={{ animation: "fade" }} />
      <Stack.Screen name="(tabs)" options={{animation:'fade'}}/>
      <Stack.Screen name="(screens)/skin-log-modal" options={{ presentation: "modal" }} />
      <Stack.Screen
        name="(screens)/routine-steps"
        options={{ presentation: "modal", animation: "slide_from_bottom" }}
      />
      <Stack.Screen
        name="(screens)/skin-goal"
        options={{
          presentation: "card",
          animation: "slide_from_bottom",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="(screens)/skin-comparison-modal"
        options={{ presentation: "modal", animation: "slide_from_bottom" }}
      />
      <Stack.Screen
        name="(screens)/product-search"
        options={{
          presentation: "transparentModal",
          animation: "fade",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="(screens)/product-detail"
        options={{
          headerShown: false,
          presentation: "card",
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="(screens)/new-routine"
        options={{ presentation: "modal", animation: "slide_from_bottom" }}
      />
      <Stack.Screen
        name="(screens)/add-steps"
        options={{
          headerShown: false,
          presentation: "card",
          animation: "fade",
        }}
      />
      <Stack.Screen
        name="(screens)/edit-skin-profile"
        options={{
          headerShown: false,
          presentation: "card",
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="(screens)/edit-skin-field"
        options={{
          headerShown: false,
          presentation: "card",
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="(screens)/routine-preferences"
        options={{
          headerShown: false,
          presentation: "card",
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="(screens)/my-shelf"
        options={{
          headerShown: false,
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
      <Stack.Screen
        name="(screens)/faq"
        options={{
          headerShown: false,
          presentation: "card",
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="(screens)/app-settings"
        options={{
          headerShown: false,
          presentation: "card",
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="(screens)/contact-us"
        options={{
          headerShown: false,
          presentation: "card",
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="(screens)/skin-summary"
        options={{
          headerShown: false,
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
      <Stack.Screen
        name="(screens)/critical-error"
        options={{
          headerShown: false,
          presentation: "transparentModal",
          animation: "fade",
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    SFProRounded_Regular: require('../../src/assets/fonts/SF-Pro-Rounded-Regular.otf'),
    SFProRounded_Medium: require('../../src/assets/fonts/SF-Pro-Rounded-Medium.otf'),
    SFProRounded_Semibold: require('../../src/assets/fonts/SF-Pro-Rounded-Semibold.otf'),
    SFProRounded_Bold: require('../../src/assets/fonts/SF-Pro-Rounded-Bold.otf'),
  });
  const [splashDone, setSplashDone] = useState(false);

  // Connectivity lives above ClerkProvider on purpose: offline, Clerk may never
  // finish loading, and `ClerkLoaded` would then never render `AuthRouter`. The
  // gate has to work regardless, so the user gets "turn on your data" instead of
  // a splash that fades into nothing.
  useEffect(() => {
    return startConnectivityWatch();
  }, []);
  useColdStartGate();

  // Native splash stays up (preventAutoHideAsync) until fonts resolve and the
  // animated overlay mounts, so this early return shows no blank frame. Proceed
  // on a font error too, otherwise the held native splash would never hide.
  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <BottomSheetModalProvider>
          <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
            <ClerkLoaded>
              <PersistQueryClientProvider
                client={queryClient}
                persistOptions={persistOptions}
                // Writes queued in a previous session are restored paused; they
                // only replay once something asks them to. (React Query resumes
                // automatically when `onlineManager` flips online, but nothing
                // flips on a launch that's already online.)
                onSuccess={() => queryClient.resumePausedMutations()}
              >
                <RevenueCatProvider>
                  <NotificationsProvider>
                    <AuthRouter />
                  </NotificationsProvider>
                </RevenueCatProvider>
              </PersistQueryClientProvider>
            </ClerkLoaded>
          </ClerkProvider>
        </BottomSheetModalProvider>
      </ErrorBoundary>
      <Toast config={toastConfig} topOffset={60} />
      {!splashDone && <AnimatedSplash onFinish={() => setSplashDone(true)} />}
    </GestureHandlerRootView>
  );
}
