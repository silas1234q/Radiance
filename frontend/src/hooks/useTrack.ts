import { useCallback } from 'react';
import { usePostHog } from 'posthog-react-native';
import type { AnalyticsEvent, AnalyticsEventProps } from '../lib/analytics/events';

/**
 * Typed `capture` for the events declared in `lib/analytics/events.ts`.
 *
 * ```ts
 * const track = useTrack();
 * track('mood_logged');
 * track('onboarding_quiz_submitted', { answered_count: 12, total_questions: 14 });
 * ```
 *
 * The variadic tuple makes the props argument required for events that declare
 * a payload and forbidden for the `void` ones, so a call site can't forget the
 * properties an event is supposed to carry.
 *
 * With no PostHog key configured, `usePostHog()` returns undefined and every
 * call no-ops — same as the rest of the analytics layer. The returned function
 * is stable for a given client, so it's safe in a `useEffect` dependency array.
 */
export function useTrack() {
  const posthog = usePostHog();

  return useCallback(
    <E extends AnalyticsEvent>(
      event: E,
      ...args: AnalyticsEventProps[E] extends void ? [] : [AnalyticsEventProps[E]]
    ) => {
      // Cast to the SDK's JSON-shaped property bag. Every payload in
      // `AnalyticsEventProps` is a flat record of string/number/boolean, which
      // satisfies it — TS just can't see that through the generic.
      posthog?.capture(event, args[0] as Record<string, string | number | boolean> | undefined);
    },
    [posthog],
  );
}
