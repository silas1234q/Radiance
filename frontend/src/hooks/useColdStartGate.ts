/**
 * Cold-start connectivity gate.
 *
 * On launch we can't do anything useful without the network: Clerk's session
 * token is short-lived and needs a refresh round-trip, so an offline cold start
 * used to land the user in an app where every request failed — which the old
 * code then misread as an expired session and signed them out.
 *
 * Instead we hold the animated splash while we check, and if we genuinely can't
 * connect we keep holding it and put a native alert on top. A native alert is
 * deliberate: toasts render *underneath* the splash overlay (zIndex 999) and
 * would be invisible.
 *
 * Escape hatch: after a few failed attempts, a returning user who already has a
 * cached session gets "Continue Offline" so a backend outage can't brick the
 * app. A first install has nothing cached to show, so it stays blocked.
 */
import { useCallback, useEffect, useRef } from 'react';
import { Alert, type AlertButton } from 'react-native';
import { checkConnectivity, type Reachability } from '../lib/connectivity';
import { setSplashHold } from '../lib/splash/ready';
import { getAppState } from '../lib/appStateCache';

// Number of failed checks before the "Continue Offline" escape appears.
const ATTEMPTS_BEFORE_BYPASS = 3;

// Module-level so the offline-safety guards in AuthRouter can tell the
// difference between "we haven't checked yet" and "the user knowingly chose to
// continue without a connection".
let offlineBypass = false;

/** True when the user tapped "Continue Offline" on the cold-start gate. */
export function isOfflineBypass(): boolean {
  return offlineBypass;
}

const COPY: Record<Exclude<Reachability, 'online'>, { title: string; message: string }> = {
  'no-radio': {
    title: 'No Internet Connection',
    message:
      "Radiance can't connect. Please turn on mobile data or Wi-Fi to continue.",
  },
  'no-backend': {
    title: "Can't Connect",
    message:
      "Radiance can't reach the server right now. Check your connection and try again.",
  },
};

export function useColdStartGate(): void {
  const started = useRef(false);
  const resolved = useRef(false);
  const attempts = useRef(0);

  const release = useCallback(() => {
    if (resolved.current) return;
    resolved.current = true;
    setSplashHold(false);
  }, []);

  const evaluate = useCallback(async () => {
    if (resolved.current) return;

    let state: Reachability;
    try {
      state = await checkConnectivity();
    } catch {
      // The check itself should never throw, but never trap the user behind it.
      release();
      return;
    }

    if (state === 'online') {
      release();
      return;
    }

    attempts.current += 1;

    const cached = await getAppState();
    const canBypass = attempts.current >= ATTEMPTS_BEFORE_BYPASS && !!cached?.isSignedIn;

    const buttons: AlertButton[] = [];
    if (canBypass) {
      buttons.push({
        text: 'Continue Offline',
        style: 'cancel',
        onPress: () => {
          offlineBypass = true;
          release();
        },
      });
    }
    // Always present: a native alert can't be dismissed programmatically, so
    // even when connectivity comes back on its own the user needs this tap.
    buttons.push({ text: 'Try Again', onPress: () => void evaluate() });

    const { title, message } = COPY[state];
    Alert.alert(title, message, buttons, { cancelable: false });
  }, [release]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    // Hold before checking rather than after: a slow probe (captive portal)
    // could otherwise outlast the splash's own safety cap and drop the user
    // into a broken app before we've decided anything.
    setSplashHold(true);
    void evaluate();
  }, [evaluate]);
}
