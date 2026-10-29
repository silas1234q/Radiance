import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Image,
  Platform,
} from "react-native";
import {
  useSSO,
  useSignInWithApple,
  type StartAppleAuthenticationFlowReturnType,
} from "@clerk/clerk-expo";
import * as AuthSession from "expo-auth-session";
import { toast } from "@/src/lib/toast";
import { getErrorMessage } from "@/src/lib/errors";
import Svg, { Path } from "react-native-svg";
import GoogleLogo from "@/src/assets/images/googleimage.png";
import { Ionicons } from "@expo/vector-icons";
import LegalModal, { type LegalDoc } from "@/src/components/legal/LegalModal";
import { useTrack } from "@/src/hooks/useTrack";
import Logo from "@/src/assets/images/icon.png";

// Pinned rather than left to the SDK to infer. Clerk's production instance only
// hands back an authorization URL when the redirect is on its Native applications
// allowlist — an unlisted one comes back null, which is what surfaced as
// "Missing external verification redirect URL for SSO flow" in the App Store build.
// The scheme is passed explicitly so this reads as one fixed value rather than
// something resolved from app config at runtime: it has to match the allowlist
// entry exactly, so it should be greppable from here.
const SSO_REDIRECT_URL = AuthSession.makeRedirectUri({
  scheme: "radiance",
  path: "sso-callback",
});

// This exact string has to exist in Clerk Dashboard → Native applications →
// "Allowlist for mobile SSO redirect", or Clerk returns a null authorization
// URL and the flow dies before the browser ever opens. Logged in dev so the
// two can be checked against each other without guessing.
if (__DEV__) {
  console.log("[auth] SSO redirect URL:", SSO_REDIRECT_URL);
}

// After a successful sign-in the spinner keeps spinning until AuthRouter routes
// us away (this screen unmounts). This is only a safety net in case routing
// never happens. Keep it longer than sync + its retry.
const ROUTING_FALLBACK_MS = 20_000;

export default function AuthScreen() {
  const { startSSOFlow } = useSSO();
  const { startAppleAuthenticationFlow } = useSignInWithApple();
  const track = useTrack();
  const [loading, setLoading] = useState<"apple" | "google" | null>(null);
  const [legalModal, setLegalModal] = useState<LegalDoc | null>(null);
  const fallbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // First step of the activation funnel: everyone who installs and opens the
  // app lands here, so `Application Installed` → `auth_viewed` → `auth_succeeded`
  // is the drop-off worth watching.
  useEffect(() => {
    track("auth_viewed");
  }, [track]);

  useEffect(() => {
    return () => {
      if (fallbackTimer.current) clearTimeout(fallbackTimer.current);
    };
  }, []);

  const holdSpinnerUntilRouted = () => {
    if (fallbackTimer.current) clearTimeout(fallbackTimer.current);
    fallbackTimer.current = setTimeout(
      () => setLoading(null),
      ROUTING_FALLBACK_MS,
    );
  };

  // The native Apple sheet and the web SSO flow resolve to the same shape, so
  // session activation lives here rather than being duplicated. Routing is not
  // done here — AuthRouter in the root layout owns it.
  //
  // Returns true only when a session was activated, so callers know whether to
  // keep the spinner up (waiting for routing) or clear it.
  const completeSignIn = async (
    result: StartAppleAuthenticationFlowReturnType,
    provider: "apple" | "google",
  ): Promise<boolean> => {
    const { createdSessionId, setActive, signIn, signUp } = result;

    const sessionId =
      createdSessionId ?? signIn?.createdSessionId ?? signUp?.createdSessionId;

    if (!sessionId || !setActive) {
      // A transfer sign-up Clerk couldn't finish yields no session — exactly
      // what a dismissal looks like from here. Treating them alike strands the
      // user on an unchanged auth screen with no toast and no navigation, and
      // files it under 'changed their mind' in PostHog. `status` tells them
      // apart: a dismissal never created a SignUp at all.
      const status = signUp?.status;
      if (status && status !== "complete") {
        // Usually the Clerk instance requires a field Apple didn't supply.
        // Apple releases name and email only on the *first* authorization, so a
        // repeat sign-up after the account was deleted arrives with neither.
        track("auth_incomplete", {
          provider,
          status,
          missing: signUp?.missingFields?.join(",") ?? "",
        });
        toast.error(
          "We couldn't finish creating your account. Please try again.",
        );
        return false;
      }
      // No session and no SignUp: the provider sheet was closed. Tracked
      // separately from a failure — this is the "changed their mind" cohort,
      // and lumping it in with errors would make auth look broken.
      track("auth_dismissed", { provider });
      return false;
    }

    await setActive({ session: sessionId });

    const isReturning =
      sessionId === signIn?.createdSessionId &&
      sessionId !== signUp?.createdSessionId;

    track("auth_succeeded", { provider, is_returning: isReturning });
    holdSpinnerUntilRouted();
    return true;
  };

  const reportFailure = (err: unknown, provider: "apple" | "google") => {
    const clerkErr = err as {
      errors?: { code?: string; message?: string; longMessage?: string }[];
    };
    const apiCode = clerkErr?.errors?.[0]?.code;
    // Not `JSON.stringify(err)`: on an Error that yields "{}", because `message`
    // and `stack` are non-enumerable. Every SDK-level failure here — the ones
    // that throw a plain Error rather than a Clerk API error — logged as an empty
    // object, which is worse than no log at all. Pull the fields out by hand.
    console.log("SSO Error:", {
      provider,
      name: err instanceof Error ? err.name : typeof err,
      message: err instanceof Error ? err.message : String(err),
      clerkErrors: clerkErr?.errors,
    });
    // A Clerk *API* error carries `errors[]`. The SDK's own guard rails throw a
    // plain Error instead, which used to land here as `unknown` — the bucket that
    // told us nothing when production SSO broke. `sdk_error` separates "the flow
    // never reached Clerk" (almost always a dashboard misconfiguration) from a
    // real rejection, so the next one is visible in PostHog rather than anonymous.
    const code = apiCode ?? (err instanceof Error ? "sdk_error" : "unknown");
    // Clerk's code, never the message — messages can carry the email address.
    track("auth_failed", { provider, code });
    if (code === "session_exists") return;
    // Only an API error has copy fit for a user. Anything else is SDK internals
    // ("Missing external verification redirect URL for SSO flow"), which
    // `getErrorMessage` would otherwise pass through via its Error.message fallback.
    toast.error(
      apiCode
        ? getErrorMessage(err, "Sign in failed")
        : "Sign in failed. Please try again.",
    );
  };

  const handleOAuth = async (strategy: "oauth_apple" | "oauth_google") => {
    const provider = strategy === "oauth_apple" ? "apple" : "google";
    setLoading(provider);
    track("auth_started", { provider });
    let signedIn = false;
    try {
      signedIn = await completeSignIn(
        await startSSOFlow({ strategy, redirectUrl: SSO_REDIRECT_URL }),
        provider,
      );
    } catch (err: unknown) {
      reportFailure(err, provider);
    } finally {
      // On success keep spinning; AuthRouter will route and unmount this screen.
      if (!signedIn) setLoading(null);
    }
  };

  // iOS goes through the native Sign in with Apple sheet, not Clerk's browser
  // SSO. The web flow quietly leans on Safari's cookie jar — it completes in a
  // blink on a device already signed in to appleid.apple.com, but on a cold
  // device (an App Review machine) it demands an Apple ID, password and 2FA
  // inside a webview. That's what got build 1.0 (19) rejected under Guideline
  // 2.1(a) as "Sign in with Apple button does not work".
  const handleApple = async () => {
    setLoading("apple");
    track("auth_started", { provider: "apple" });
    let signedIn = false;
    try {
      signedIn = await completeSignIn(
        await startAppleAuthenticationFlow(),
        "apple",
      );
    } catch (err: unknown) {
      if ((err as { code?: string })?.code === "ERR_REQUEST_CANCELED") {
        // Clerk's hook normally swallows a cancel and hands back a null
        // session, but handle the throw too — backing out isn't a failure.
        track("auth_dismissed", { provider: "apple" });
        return;
      }
      // Native failed for a real reason — most likely this bundle isn't
      // registered on Clerk's Native applications page, which is what
      // `oauth_token_apple` validates the identity token against. Don't
      // dead-end the user: retry through the browser flow. Degraded, but it
      // signs them in, and `auth_fallback_used` makes the misconfiguration
      // visible instead of silent.
      track("auth_fallback_used", { provider: "apple" });
      try {
        signedIn = await completeSignIn(
          await startSSOFlow({
            strategy: "oauth_apple",
            redirectUrl: SSO_REDIRECT_URL,
          }),
          "apple",
        );
      } catch (fallbackErr: unknown) {
        reportFailure(fallbackErr, "apple");
      }
    } finally {
      if (!signedIn) setLoading(null);
    }
  };

  return (
    <View className="flex-1 bg-white px-[30px] pb-10 justify-between">
      <View style={{ flex: 0.3 }} />

      <View className="items-center">
        <View
          className="w-24 h-24 rounded-[20px]items-center justify-center mb-[30px] shadow-primary"
          style={{
            shadowColor: "#F06680",
            shadowOffset: { width: 0, height: 18 },
            shadowOpacity: 0.55,
            shadowRadius: 40,
            elevation: 12,
          }}
        >
          <Image
            source={Logo}
            style={{ width: "100%", height: "100%", borderRadius: 20 }}
          />
        </View>
        <Text className="text-[52px] font-poppins-extrabold tracking-[-2px] text-skin-text">
          Radiance
        </Text>
        <Text className="text-[21px] font-poppins-semibold text-skin-text mt-[18px] max-w-[260px] text-center leading-[27px]">
          Sign in or create your account
        </Text>
        <Text className="text-base text-skin-text-secondary mt-3 max-w-[250px] text-center leading-[22px]">
          New or returning, it only takes a moment.
        </Text>
      </View>

      <View className="items-center gap-4">
        {/* iOS only — native Sign in with Apple has no Android equivalent, and
            Clerk's `useSignInWithApple` throws off-iOS. Android users sign in
            with Google. */}
        {Platform.OS === "ios" && (
          <Pressable
            className="w-full h-[54px] rounded-xl bg-black flex-row items-center justify-center gap-2.5"
            style={loading ? { opacity: 0.6 } : undefined}
            disabled={!!loading}
            onPress={handleApple}
          >
            {loading === "apple" ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name={"logo-apple"} color="white" size={18} />
                <Text className="text-base font-poppins-semibold text-white">
                  Continue with Apple
                </Text>
              </>
            )}
          </Pressable>
        )}

        <Pressable
          className="w-full h-[54px] rounded-xl bg-white border-[1.5px] border-skin-border flex-row items-center justify-center gap-2.5"
          style={loading ? { opacity: 0.6 } : undefined}
          disabled={!!loading}
          onPress={() => handleOAuth("oauth_google")}
        >
          {loading === "google" ? (
            <ActivityIndicator color="#1C1C1E" />
          ) : (
            <>
              <Image source={GoogleLogo} className="w-6 h-6" />
              <Text className="text-base font-poppins-semibold text-skin-text">
                Continue with Google
              </Text>
            </>
          )}
        </Pressable>

        <Text className="text-[13px] text-skin-text-tertiary font-poppins text-center leading-[18px]">
          By continuing, you agree to our{" "}
          <Text
            onPress={() => {
              track("auth_legal_opened", { doc: "terms" });
              setLegalModal("terms");
            }}
            style={{ textDecorationLine: "underline" }}
          >
            Terms of Use
          </Text>{" "}
          and{" "}
          <Text
            onPress={() => {
              track("auth_legal_opened", { doc: "privacy" });
              setLegalModal("privacy");
            }}
            style={{ textDecorationLine: "underline" }}
          >
            Privacy Policy
          </Text>
        </Text>
      </View>

      <LegalModal doc={legalModal} onClose={() => setLegalModal(null)} />
    </View>
  );
}
