import { useEffect, useRef, useState } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import {
  ClerkProvider,
  ClerkLoaded,
  useAuth,
  useUser,
  useClerk,
} from "@clerk/clerk-expo";
import { QueryClient, MutationCache, QueryCache } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import * as WebBrowser from "expo-web-browser";
import Toast from "react-native-toast-message";
import { tokenCache } from "../lib/clerk";
import { apiCall, authHeaders } from "../api/apiClient";
import { getAppState, setAppState, clearAppState } from "../lib/appStateCache";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { RevenueCatProvider } from "../providers/RevenueCatProvider";
import { NotificationsProvider } from "../providers/NotificationsProvider";
import { AnalyticsProvider } from "../providers/AnalyticsProvider";
import AnalyticsTracker from "../components/analytics/AnalyticsTracker";
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
import {
  onSessionExpired,
  resetSessionExpiry,
  suppressSessionExpiry,
  isSessionExpirySuppressed,
  markAuthSettled,
} from "../lib/sessionExpiry";
import { persister, persistOptions } from "../lib/queryPersister";
import { registerMutationDefaults } from "../lib/mutationDefaults";
import {
  checkConnectivity,
  getIsOnline,
  startConnectivityWatch,
} from "../lib/connectivity";
import {
  setClerkAuth,
  markBackendReady,
  resetBackendReady,
} from "../lib/authToken";
import { useColdStartGate } from "../hooks/useColdStartGate";
import { useReachability } from "../hooks/useReachability";
import { useSubmitQuiz } from "../hooks/queries/useQuiz";
import "../../global.css";
import { hasSeenWelcome } from "../lib/welcomeCache";
import { clearOnboardingData, getOnboardingData } from "../lib/onboardingCache";

WebBrowser.maybeCompleteAuthSession();

const LAST_USER_KEY = "radiance:last-user-id";

SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ duration: 300, fade: true });

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // NOTE: on React Query v5 this option is `gcTime`.
      cacheTime: 1000 * 60 * 60 * 24 * 7,
      networkMode: "offlineFirst",
      retry: (failureCount, err) => {
        if (isUnauthorizedError(err)) return false;
        if (isCancelledError(err)) return false;
        if (isBadResponseError(err)) return false;
        if (isTimeoutError(err)) return false;
        if (isNetworkError(err)) {
          if (!getIsOnline()) return false;
          return failureCount < 2;
        }
        return failureCount < 2;
      },
    },
    mutations: {
      networkMode: "offlineFirst",
    },
  },
  mutationCache: new MutationCache({
    onError: (err, _vars, _ctx, mutation) => {
      if (mutation.meta?.suppressErrorToast) return;
      if (isUnauthorizedError(err)) return;
      if (mutation.state.isPaused) return;
      toast.fromError(err);
    },
  }),
  queryCache: new QueryCache({
    onError: (err, query) => {
      if (__DEV__ && (err as { type?: string })?.type === "CANCELLED") {
        console.log("[signed-out query]", JSON.stringify(query.queryKey));
      }
      if (isUnauthorizedError(err)) return;
      if (query.meta?.suppressErrorToast) return;
      if (query.state.data !== undefined) return;
      if (query.getObserversCount() === 0) return;
      if (isNetworkError(err)) toast.fromError(err);
    },
  }),
});

registerMutationDefaults(queryClient);

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error("EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is not set");
}

/** Returns isOnboarded, or null if the backend couldn't be reached / rejected us. */
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
  } catch (e) {
    console.warn("[auth/sync] failed", e);
    return null;
  }
}

function AuthRouter() {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const segments = useSegments();
  const { mutateAsync: submitQuiz } = useSubmitQuiz();

  const navigatedForSignIn = useRef(false);
  const cachedNavDone = useRef(false);
  const phase1 = useRef<Promise<void>>(Promise.resolve());
  const cachedNavState = useRef<{
    isSignedIn: boolean;
    isOnboarded: boolean;
  } | null>(null);
  const hasEverBeenSignedIn = useRef(false);
  const coldStartTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refs so effects always see current values without re-running.
  const isSignedInRef = useRef(false);
  isSignedInRef.current = !!isSignedIn;
  const segmentsRef = useRef(segments);
  segmentsRef.current = segments;
  const submitQuizRef = useRef(submitQuiz);
  submitQuizRef.current = submitQuiz;
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  useEffect(() => {
    setClerkAuth(getToken, isSignedIn);
  }, [getToken, isSignedIn]);

  // Don't leave the cold-start timer running after unmount.
  useEffect(() => {
    return () => {
      if (coldStartTimer.current) clearTimeout(coldStartTimer.current);
    };
  }, []);

  // Auto sign-out when the backend returns 401 (session expired)
  useEffect(() => {
    return onSessionExpired(() => {
      if (!isSignedInRef.current) return;
      if (isSessionExpirySuppressed()) return;
      if (!getIsOnline()) return;
      console.log("[session] expired → signing out");
      suppressSessionExpiry();
      resetBackendReady();
      toast.error("Your session expired. Please sign in again.");
      queryClient.cancelQueries();
      queryClient.clear();
      signOut();
    });
  }, [signOut]);

  // Phase 1: optimistic navigation from cache (runs once). Phase 2 awaits it.
  useEffect(() => {
    if (cachedNavDone.current) return;
    cachedNavDone.current = true;

    phase1.current = (async () => {
      const cached = await getAppState();
      if (!cached) return;

      cachedNavState.current = {
        isSignedIn: cached.isSignedIn,
        isOnboarded: cached.isOnboarded,
      };

      if (cached.isSignedIn && cached.isOnboarded) {
        router.replace("/(tabs)");
      } else if (cached.isSignedIn && !cached.isOnboarded) {
        // No setNavReady(): this prediction is often stale, so Phase 2 confirms.
        router.replace("/(onboarding)/quiz");
        return;
      } else {
        router.replace("/auth");
      }
      setNavReady();
    })().catch(() => {});
  }, []);

  // Phase 2: backend confirmation
  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn && !user) return;

    let stale = false;

    if (isSignedIn && user) {
      hasEverBeenSignedIn.current = true;
      markAuthSettled();
      resetSessionExpiry();
      if (coldStartTimer.current) {
        clearTimeout(coldStartTimer.current);
        coldStartTimer.current = null;
      }
      if (navigatedForSignIn.current) return;
      navigatedForSignIn.current = true;

      // NOTE: deliberately not cancelled by `stale` — once started, this flow
      // must finish even if `user` changes identity mid-way.
      (async () => {
        const t0 = Date.now();
        const lap = (label: string) =>
          console.log(`[auth-flow] ${label} +${Date.now() - t0}ms`);

        try {
          await phase1.current;
          lap("phase1 done");

          // 1. Wipe cache only when a different account signs in.
          try {
            const lastUserId = await AsyncStorage.getItem(LAST_USER_KEY);
            if (lastUserId !== user.id) {
              queryClient.clear();
              await persister.removeClient();
              await clearAppState();
              await AsyncStorage.setItem(LAST_USER_KEY, user.id);
            }
          } catch {}
          lap("storage");

          // 2. Sync: the only thing we must wait for before routing, because
          //    isOnboarded decides the destination.
          let isOnboarded = await syncUserWithBackend(() =>
            getTokenRef.current(),
          );
          if (isOnboarded === null) {
            await new Promise((r) => setTimeout(r, 800));
            isOnboarded = await syncUserWithBackend(() =>
              getTokenRef.current({ skipCache: true }),
            );
          }
          const synced = isOnboarded !== null;
          if (!synced) isOnboarded = !!user.publicMetadata?.onboarded;
          lap(`sync (${synced ? "ok" : "failed"})`);

          // 3. Route immediately. The gate in authToken.ts keeps every other
          //    authed request waiting until the right work below is finished.
          const data = await getOnboardingData();

          if (isOnboarded) {
            if (synced) markBackendReady();
            void setAppState({
              isSignedIn: true,
              isOnboarded: true,
              userId: user.id,
            });
            router.replace("/(tabs)");
          } else if (data && data.length > 0) {
            void setAppState({
              isSignedIn: true,
              isOnboarded: false,
              userId: user.id,
            });
            router.replace("/(onboarding)/QuizResults");
            setNavReady();

            // Background: submit the cached answers, then open the gate so
            // analyze and friends can fire.
            void (async () => {
              try {
                if (synced) {
                  await submitQuizRef.current(data);
                  await clearOnboardingData(); // only after success
                  lap("quiz submitted");
                }
              } catch (e) {
                // Keep the answers; useAutoSubmitQuiz retries later.
                console.warn("[quiz] submit failed, keeping local answers", e);
              } finally {
                if (synced) markBackendReady();
              }
            })();
          } else {
            if (synced) markBackendReady();
            void setAppState({
              isSignedIn: true,
              isOnboarded: false,
              userId: user.id,
            });
            router.replace("/(onboarding)/quiz");
          }
          lap("routed");
        } catch (e) {
          console.warn("[auth] post-sign-in routing failed", e);
          router.replace(
            user.publicMetadata?.onboarded ? "/(tabs)" : "/(onboarding)/quiz",
          );
        } finally {
          setNavReady();
        }
      })();
    } else {
      void (async () => {
        await phase1.current; // cachedNavState must be populated first
        if (stale) return;

        const hadSession =
          !isSessionExpirySuppressed() &&
          (hasEverBeenSignedIn.current || !!cachedNavState.current?.isSignedIn);

        if (hadSession) {
          const armGuard = () => {
            coldStartTimer.current = setTimeout(async () => {
              coldStartTimer.current = null;
              if ((await checkConnectivity()) !== "online") {
                armGuard();
                return;
              }
              hasEverBeenSignedIn.current = true;
              markAuthSettled();
              navigatedForSignIn.current = false;
              suppressSessionExpiry();
              resetBackendReady();
              queryClient.clear();
              void persister.removeClient();
              void AsyncStorage.removeItem(LAST_USER_KEY);
              void clearAppState();
              router.replace("/auth");
            }, 10000);
          };
          if (!coldStartTimer.current) armGuard();
          setNavReady();
          return;
        }

        navigatedForSignIn.current = false;
        markAuthSettled();
        resetBackendReady();
        // Do NOT resetSessionExpiry() here (races with in-flight token retries).
        queryClient.clear();
        void persister.removeClient();
        void AsyncStorage.removeItem(LAST_USER_KEY);
        void clearAppState();

        const cached = cachedNavState.current;
        if (!cached || cached.isSignedIn !== false) {
          const hadAccount =
            hasEverBeenSignedIn.current || !!cached?.isSignedIn;
          const onGuestScreen = segmentsRef.current.some(
            (s) => s === "auth" || s === "Welcome",
          );
          hasSeenWelcome()
            .catch(() => true)
            .then((seen) => {
              if (!hadAccount && !seen) {
                if (!onGuestScreen) router.replace("/Welcome");
              } else if (!onGuestScreen) {
                router.replace("/auth");
              }
            })
            .finally(() => setNavReady());
          return;
        }
        setNavReady();
      })();
    }

    return () => {
      stale = true;
    };
  }, [isSignedIn, isLoaded, user?.id]);

  return (
    <Stack
      screenOptions={{ headerShown: false }}
      initialRouteName="(screens)/auth"
    >
      <Stack.Screen
        name="Welcome"
        options={{ animation: "fade", headerShown: false }}
      />
      <Stack.Screen name="(screens)/auth" options={{ animation: "fade" }} />
      <Stack.Screen name="(onboarding)" options={{ animation: "fade" }} />
      <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
      <Stack.Screen
        name="(screens)/skin-log-modal"
        options={{ presentation: "modal" }}
      />
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
    SFProRounded_Regular: require("../../src/assets/fonts/SF-Pro-Rounded-Regular.otf"),
    SFProRounded_Medium: require("../../src/assets/fonts/SF-Pro-Rounded-Medium.otf"),
    SFProRounded_Semibold: require("../../src/assets/fonts/SF-Pro-Rounded-Semibold.otf"),
    SFProRounded_Bold: require("../../src/assets/fonts/SF-Pro-Rounded-Bold.otf"),
  });
  const [splashDone, setSplashDone] = useState(false);

  const startedOffline = useColdStartGate();
  const reachability = useReachability();
  useEffect(() => {
    return startConnectivityWatch();
  }, []);

  useEffect(() => {
    if (!splashDone || !startedOffline) return;
    if (reachability === "online") return;
    toast.error(
      reachability === "no-radio"
        ? "Showing your saved data. Check your mobile data or Wi-Fi."
        : "Showing your saved data. We'll refresh once we can reach Radiance.",
      { title: "You're offline" },
    );
  }, [splashDone, startedOffline, reachability]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AnalyticsProvider>
        <ErrorBoundary>
          <BottomSheetModalProvider>
            <ClerkProvider
              publishableKey={publishableKey}
              tokenCache={tokenCache}
            >
              <ClerkLoaded>
                <PersistQueryClientProvider
                  client={queryClient}
                  persistOptions={persistOptions}
                  onSuccess={() => queryClient.resumePausedMutations()}
                >
                  <RevenueCatProvider>
                    <NotificationsProvider>
                      <AnalyticsTracker />
                      <AuthRouter />
                    </NotificationsProvider>
                  </RevenueCatProvider>
                </PersistQueryClientProvider>
              </ClerkLoaded>
            </ClerkProvider>
          </BottomSheetModalProvider>
        </ErrorBoundary>
      </AnalyticsProvider>
      <Toast config={toastConfig} topOffset={60} />
      {!splashDone && <AnimatedSplash onFinish={() => setSplashDone(true)} />}
    </GestureHandlerRootView>
  );
}
