/**
 * Cold-start connectivity gate.
 *
 * On launch we can't do anything useful without the network: Clerk's session
 * token is short-lived and needs a refresh round-trip, so an offline cold start
 * used to land the user in an app where every request failed — which the old
 * code then misread as an expired session and signed them out.
 *
 * So we hold the animated splash while we check. What happens if that check
 * fails depends on whether we have anything to show:
 *
 *  - **Returning user** (a cached session exists): let them straight in. Their
 *    persisted query cache has real data, queries are `offlineFirst`, and
 *    `AuthRouter`'s guards already refuse to sign anyone out while offline. We
 *    report it upward instead, and the caller says so with a toast once the
 *    splash is out of the way. Blocking them buys nothing.
 *  - **First install** (nothing cached): there is genuinely no app to show, so
 *    we keep holding the splash and put a native alert on top. A native alert is
 *    deliberate: toasts render *underneath* the splash overlay (zIndex 999) and
 *    would be invisible.
 *
 * The check itself is `coldStartCheck()` — several attempts on a generous
 * timeout — because the first request of a launch is the slowest one the app
 * ever makes, and a single impatient probe was reporting healthy connections as
 * outages.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { coldStartCheck, type Reachability } from '../lib/connectivity';
import { setSplashHold } from '../lib/splash/ready';
import { getAppState } from '../lib/appStateCache';
import { useReachability } from './useReachability';

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

/**
 * Holds the splash until connectivity is resolved.
 *
 * @returns whether we entered the app without a connection, so the caller can
 * surface a non-blocking notice once the splash has finished.
 */
export function useColdStartGate(): boolean {
  const [startedOffline, setStartedOffline] = useState(false);
  const started = useRef(false);
  const resolved = useRef(false);
  // True while a blocking alert is on screen, so the recovery effect below knows
  // there's something to release.
  const blocked = useRef(false);
  const reachability = useReachability();

  const release = useCallback(() => {
    if (resolved.current) return;
    resolved.current = true;
    blocked.current = false;
    setSplashHold(false);
  }, []);

  const evaluate = useCallback(async () => {
    if (resolved.current) return;

    let state: Reachability;
    try {
      state = await coldStartCheck();
    } catch {
      // The check itself should never throw, but never trap the user behind it.
      release();
      return;
    }

    // Connectivity may have been restored (and the gate released) while we were
    // still probing.
    if (resolved.current) return;

    if (state === 'online') {
      release();
      return;
    }

    // Can't reach Radiance. If this user has been here before, their persisted
    // cache has something worth showing — let them in and warn softly.
    const cached = await getAppState();
    if (cached?.isSignedIn) {
      setStartedOffline(true);
      release();
      return;
    }

    // First install: there's no cached app to fall back to, so this is the one
    // case where blocking is the honest thing to do.
    blocked.current = true;
    const { title, message } = COPY[state];
    Alert.alert(title, message, [{ text: 'Try Again', onPress: () => void evaluate() }], {
      cancelable: false,
    });
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

  // Self-heal. `Alert.alert` can't be dismissed programmatically, so a user who
  // fixes their Wi-Fi would otherwise sit behind a stale alert. We can at least
  // drop the splash hold the moment the watcher sees us come back, so their
  // "Try Again" tap lands in a ready app instead of starting another probe.
  useEffect(() => {
    if (reachability !== 'online') return;
    if (!blocked.current) return;
    release();
  }, [reachability, release]);

  return startedOffline;
}
