import { useEffect, useRef } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import {
  ClerkProvider,
  ClerkLoaded,
  useAuth,
  useUser,
} from "@clerk/clerk-expo";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { tokenCache } from "../lib/clerk";
import { apiCall, authHeaders } from "../api/apiClient";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import "../../global.css";

const queryClient = new QueryClient();

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
  const router = useRouter();
  const segments = useSegments();
  const navigatedForSignIn = useRef(false);

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn && user) {
      if (navigatedForSignIn.current) return;
      navigatedForSignIn.current = true;

      (async () => {
        queryClient.clear();
        const backendOnboarded = await syncUserWithBackend(getToken);
        await user.reload();

        const isOnboarded = backendOnboarded ?? !!user.publicMetadata?.onboarded;
        router.replace(isOnboarded ? "/(tabs)" : "/(onboarding)/quiz");
      })();
    } else {
      navigatedForSignIn.current = false;
      queryClient.clear();

      if (segments[0] !== "auth") {
        router.replace("/auth");
      }
    }
  }, [isSignedIn, isLoaded, user]);

  return (
    <Stack screenOptions={{ headerShown: false }} initialRouteName="auth">
      <Stack.Screen name="auth" options={{ animation: "fade" }} />
      <Stack.Screen name="(onboarding)" options={{ animation: "fade" }} />
      <Stack.Screen name="(tabs)" options={{animation:'fade'}}/>
      <Stack.Screen name="skin-log-modal" options={{ presentation: "modal" }} />
      <Stack.Screen
        name="routine-steps"
        options={{ presentation: "modal", animation: "slide_from_bottom" }}
      />
      <Stack.Screen
        name="skin-goal"
        options={{
          presentation: "card",
          animation: "slide_from_bottom",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="skin-comparison-modal"
        options={{ presentation: "modal", animation: "slide_from_bottom" }}
      />
      <Stack.Screen
        name="product-search"
        options={{
          presentation: "transparentModal",
          animation: "fade",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="product-detail"
        options={{
          headerShown: false,
          presentation: "card",
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="new-routine"
        options={{ presentation: "modal", animation: "slide_from_bottom" }}
      />
      <Stack.Screen
        name="add-steps"
        options={{
          headerShown: false,
          presentation: "card",
          animation: "fade",
        }}
      />
      <Stack.Screen
        name="edit-skin-profile"
        options={{
          headerShown: false,
          presentation: "card",
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="edit-skin-field"
        options={{
          headerShown: false,
          presentation: "card",
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="routine-preferences"
        options={{
          headerShown: false,
          presentation: "card",
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="my-shelf"
        options={{
          headerShown: false,
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
      <Stack.Screen
        name="faq"
        options={{
          headerShown: false,
          presentation: "card",
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="app-settings"
        options={{
          headerShown: false,
          presentation: "card",
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="contact-us"
        options={{
          headerShown: false,
          presentation: "card",
          animation: "slide_from_right",
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    SFProRounded_Regular: require('../../src/assets/fonts/SF-Pro-Rounded-Regular.otf'),
    SFProRounded_Medium: require('../../src/assets/fonts/SF-Pro-Rounded-Medium.otf'),
    SFProRounded_Semibold: require('../../src/assets/fonts/SF-Pro-Rounded-Semibold.otf'),
    SFProRounded_Bold: require('../../src/assets/fonts/SF-Pro-Rounded-Bold.otf'),
  });

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
          <ClerkLoaded>
            <QueryClientProvider client={queryClient}>
              <AuthRouter />
            </QueryClientProvider>
          </ClerkLoaded>
        </ClerkProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
