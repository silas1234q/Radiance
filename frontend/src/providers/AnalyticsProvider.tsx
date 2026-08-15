import type { ReactNode } from "react";
import { PostHogProvider } from "posthog-react-native";

const rawKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY?.trim();

// A key left at the `.env.example` placeholder is worse than no key: it's
// truthy, so the SDK initialises, batches events and POSTs them to PostHog,
// which rejects every request. You get retries and zero data, silently. Treat
// it as unconfigured.
const isPlaceholder = (key: string) => /^phc_(your|xxx|placeholder|replace|todo)/i.test(key);

const apiKey = rawKey && !isPlaceholder(rawKey) ? rawKey : undefined;

const host = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

/**
 * PostHog analytics.
 *
 * Without a key configured this renders straight through, so a dev checkout with
 * no PostHog credentials behaves exactly as it did before — `usePostHog()` then
 * returns undefined and every `useTrack()` call no-ops. Never let analytics be
 * the reason the app won't boot.
 *
 * Mounted ABOVE `ClerkProvider` in `_layout.tsx`. It has no dependency on Clerk
 * (only `AnalyticsTracker` does), and sitting inside `ClerkLoaded` meant that
 * when Clerk never finished loading — the offline cold start the root layout
 * explicitly handles — PostHog never initialised at all, losing `Application
 * Opened` for exactly the degraded sessions worth investigating.
 *
 * Autocapture is deliberately narrowed:
 *
 *  - `captureScreens: false`. The library's screen tracking calls
 *    `useNavigation()` / `useNavigationState()` from @react-navigation, which
 *    expects to sit inside a navigator. This provider mounts above the root
 *    Stack, where those throw (the library swallows it into a console.error and
 *    then tracks nothing). `AnalyticsTracker` reads Expo Router's `usePathname`
 *    instead, which is both reliable here and gives cleaner route names.
 *  - `captureTouches: false`. It's off by default in v4 anyway, and blanket
 *    touch capture on a screen showing someone's face scan is not a default
 *    worth inheriting — see the PII note in `lib/analytics/events.ts`.
 *
 * App lifecycle events stay on (passing an autocapture *object* rather than
 * `false` leaves `captureAppLifecycleEvents` enabled): `Application Installed`,
 * `Application Updated`, `Application Opened`, `Application Became Active` and
 * `Application Backgrounded`. Those plus the SDK-managed `$session_id` are what
 * make install-to-activation drop-off and session analysis possible without any
 * custom instrumentation.
 */
export function AnalyticsProvider({ children }: { children: ReactNode }) {
  if (!apiKey) return <>{children}</>;

  return (
    <PostHogProvider
      apiKey={apiKey}
      options={{ host }}
      autocapture={{ captureScreens: false, captureTouches: false }}
    >
      {children}
    </PostHogProvider>
  );
}
