import posthog from 'posthog-js'

const token = import.meta.env.VITE_POSTHOG_PROJECT_TOKEN
const host = import.meta.env.VITE_POSTHOG_HOST ?? 'https://us.i.posthog.com'

/** True once `initAnalytics` has actually started PostHog. */
export let analyticsEnabled = false

/**
 * Start PostHog, if a token is configured.
 *
 * No token means no init — a local checkout or a preview deploy without
 * credentials then runs with analytics simply absent, rather than firing
 * requests at a project that doesn't exist. `posthog` is still safe to import
 * and call anywhere; an uninitialised client no-ops.
 */
export function initAnalytics() {
  if (!token || analyticsEnabled) return

  posthog.init(token, {
    api_host: host,
    // Pins the SDK's default behaviour to a known set, so a later posthog-js
    // upgrade can't silently switch on new capture behaviour. Bump this
    // deliberately after reading what changed.
    defaults: '2026-05-30',
  })
  analyticsEnabled = true
}

export { posthog }
