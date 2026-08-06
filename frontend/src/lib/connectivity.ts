/**
 * Connectivity state for the whole app.
 *
 * Two signals, because neither is sufficient on its own:
 *  - `expo-network` reports the radio/Wi-Fi state, which is what lets us say
 *    "turn on your mobile data" specifically. But on iOS `isInternetReachable`
 *    is always just a copy of `isConnected`, so a connected device on a captive
 *    portal or with our backend down still reads as online.
 *  - A short probe of `/api/health` answers the only question that actually
 *    matters: can we reach Radiance right now?
 *
 * Everything else in the app reads `getIsOnline()` before treating a failure as
 * a real error — in particular, before ever concluding that a session expired.
 * Exposed as an external store (same shape as `lib/splash/ready.ts`) so it works
 * from `useSyncExternalStore` and from plain modules alike.
 */
import { AppState, type AppStateStatus } from 'react-native';
import * as Network from 'expo-network';
import { onlineManager } from '@tanstack/react-query';
import { getBaseUrl } from '../api/baseUrl';

/**
 * `no-radio`   — the device has no active connection (airplane mode, data off).
 * `no-backend` — the device is connected but we can't reach the API.
 */
export type Reachability = 'online' | 'no-radio' | 'no-backend';

const PROBE_TIMEOUT_MS = 6_000;

type Listener = () => void;

// Optimistic until something tells us otherwise — the app must behave exactly
// as it does today until a check or a failed request proves we're offline.
let reachability: Reachability = 'online';
const listeners = new Set<Listener>();

export function getReachability(): Reachability {
  return reachability;
}

export function getIsOnline(): boolean {
  return reachability === 'online';
}

export function subscribeConnectivity(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function setReachability(next: Reachability): void {
  if (next === reachability) return;
  reachability = next;
  // Lets React Query pause retries while we're offline and refetch on reconnect.
  // Safe with `networkMode: 'offlineFirst'`: the first attempt still runs, so
  // nothing gets stuck permanently paused.
  onlineManager.setOnline(next === 'online');
  for (const l of listeners) l();
}

/**
 * Called by `apiClient` when a request fails at the transport layer. It only
 * *triggers* a check — it deliberately does not flip the state itself.
 *
 * An earlier version downgraded to `no-backend` synchronously, which meant a
 * single failed request (a backend restart, one flaky call) made every other
 * request fail fast with NETWORK_ERROR until the probe caught up. One bad
 * request must not take the whole app offline; only the probe decides.
 */
export function reportNetworkFailure(): void {
  void checkConnectivity();
}

/** Can we reach the API? Resolves `false` rather than throwing. */
export async function probeBackend(timeoutMs = PROBE_TIMEOUT_MS): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${getBaseUrl()}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

// Concurrent callers share one check (same pattern as the token dedupe in
// `api/authedFetch.ts`) so a burst of failing queries triggers a single probe.
let inflightCheck: Promise<Reachability> | null = null;

export function checkConnectivity(): Promise<Reachability> {
  if (inflightCheck) return inflightCheck;
  inflightCheck = runCheck().finally(() => {
    inflightCheck = null;
  });
  return inflightCheck;
}

async function runCheck(): Promise<Reachability> {
  let connected = true;
  let internetReachable: boolean | undefined;
  try {
    const state = await Network.getNetworkStateAsync();
    connected = state.isConnected !== false;
    internetReachable = state.isInternetReachable;
  } catch {
    // Couldn't read the radio state — fall through to the probe, which is the
    // authoritative signal anyway.
  }

  // No active connection at all: nothing to probe.
  if (!connected) {
    setReachability('no-radio');
    return 'no-radio';
  }

  // Otherwise always probe, even when the OS claims the internet is
  // unreachable. On Android `isInternetReachable` reads false while the system
  // is still validating a network, and treating that as offline would fail
  // every request on a connection that actually works. If our backend answers,
  // we're online — that's the only claim that matters.
  const reachable = await probeBackend();
  if (reachable) {
    setReachability('online');
    return 'online';
  }

  // Probe failed. Use the radio hint only to word the failure: "turn on your
  // data" vs "we can't reach the server".
  const next: Reachability = internetReachable === false ? 'no-radio' : 'no-backend';
  setReachability(next);
  return next;
}

let stopWatch: (() => void) | null = null;

/**
 * Starts watching connectivity: re-checks on radio changes and whenever the app
 * comes back to the foreground. Idempotent — safe to call from a mounting
 * component. Returns a teardown.
 */
export function startConnectivityWatch(): () => void {
  if (stopWatch) return stopWatch;

  void checkConnectivity();

  const netSub = Network.addNetworkStateListener(() => {
    void checkConnectivity();
  });
  const appSub = AppState.addEventListener('change', (status: AppStateStatus) => {
    if (status === 'active') void checkConnectivity();
  });

  stopWatch = () => {
    netSub.remove();
    appSub.remove();
    stopWatch = null;
  };
  return stopWatch;
}
