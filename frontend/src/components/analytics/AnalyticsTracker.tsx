import { useEffect, useRef } from "react";
import { usePathname } from "expo-router";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { usePostHog } from "posthog-react-native";

/**
 * Ties PostHog to Clerk's session and to Expo Router's current route.
 *
 * Renders nothing — mount it once, inside both `AnalyticsProvider` and
 * `ClerkProvider`.
 *
 * `usePostHog()` is typed as always returning a client, but the context default
 * is `undefined`, so it really does come back undefined when no key is
 * configured and `AnalyticsProvider` passed through. Every use is guarded.
 *
 * PII: the person profile is keyed on the Clerk user id and carries nothing
 * else. Radiance holds skin photos and health-adjacent answers, so shipping
 * emails to a third-party analytics vendor should be a deliberate decision
 * rather than something that arrived with the SDK. To add it once you've made
 * that call, pass a second argument to `identify`:
 *
 *   posthog.identify(user.id, { email: user.primaryEmailAddress?.emailAddress })
 */
export default function AnalyticsTracker() {
  const posthog = usePostHog();
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const pathname = usePathname();
  const identifiedAs = useRef<string | null>(null);

  // Identify on sign-in, reset on sign-out. `reset()` matters on a shared
  // device: without it the next account inherits the previous one's distinct id
  // and their events merge into one person.
  useEffect(() => {
    if (!posthog || !isLoaded) return;

    if (isSignedIn && user) {
      if (identifiedAs.current === user.id) return;
      identifiedAs.current = user.id;
      posthog.identify(user.id);
    } else if (!isSignedIn && identifiedAs.current) {
      identifiedAs.current = null;
      posthog.reset();
    }
  }, [posthog, isLoaded, isSignedIn, user]);

  // Screen views. Expo Router resolves groups away, so this reports `/routine`
  // rather than `/(tabs)/routine`.
  useEffect(() => {
    if (!posthog || !pathname) return;
    posthog.screen(pathname);
  }, [posthog, pathname]);

  return null;
}
