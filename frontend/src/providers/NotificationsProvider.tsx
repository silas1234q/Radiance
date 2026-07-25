/**
 * NotificationsProvider
 *
 * Owns the app-wide notification lifecycle:
 *  - installs the notification handler + Android channel once,
 *  - hydrates persisted settings,
 *  - routes taps on a notification to the relevant screen,
 *  - (when signed in) reconciles locally-scheduled reminders whenever the
 *    settings, routines, or gamification state change, and on app foreground.
 *
 * Phase 2 (server push) will additionally register the Expo push token here.
 */
import React, { useCallback, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import type * as NotificationsTypes from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { useRoutines } from '../hooks/queries/useRoutines';
import { useGamification, useWeeklyCompletions } from '../hooks/queries/useGamification';
import { useRegisterPushToken } from '../hooks/queries/useRegisterPushToken';
import { useNotificationSettings } from '../hooks/useNotificationSettings';
import {
  getDeviceTimezone,
  getExpoPushToken,
  hasNotificationPermission,
  hydrateSettings,
  installNotificationHandler,
  notificationsModule,
  reconcileLocalNotifications,
} from '../lib/notifications';

/** Runs the query-driven reconcile loop; only mounted while signed in. */
function NotificationScheduler() {
  const { settings, loaded } = useNotificationSettings();
  const { data: routines } = useRoutines();
  const { data: gamification } = useGamification();
  const { data: weekly } = useWeeklyCompletions();

  const todayIsFullDay = React.useMemo(() => {
    if (!weekly) return undefined;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const entry = weekly.find((d) => {
      const dd = new Date(d.date);
      dd.setHours(0, 0, 0, 0);
      return dd.getTime() === today.getTime();
    });
    return entry?.isFullDay;
  }, [weekly]);

  const reconcile = useCallback(() => {
    if (!loaded) return;
    void reconcileLocalNotifications({
      settings,
      routines: routines ?? [],
      gamification,
      todayIsFullDay,
    });
  }, [loaded, settings, routines, gamification, todayIsFullDay]);

  // Reconcile whenever the inputs change.
  useEffect(() => {
    reconcile();
  }, [reconcile]);

  // Re-reconcile when the app returns to the foreground (a day may have
  // completed, or scheduled one-shots need topping up).
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active') reconcile();
    });
    return () => sub.remove();
  }, [reconcile]);

  // ── Phase 2: register the Expo push token + server-push preferences ──
  const register = useRegisterPushToken();
  // undefined = not yet attempted; null = attempted, none available.
  const tokenRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (!loaded) return;
    let cancelled = false;

    (async () => {
      const pushOn = settings.pushNotifications;

      // Acquire the token lazily, only once, when enabled and permitted.
      if (pushOn && tokenRef.current === undefined) {
        if (await hasNotificationPermission()) {
          tokenRef.current = await getExpoPushToken();
        }
      }
      if (cancelled) return;

      register.mutate({
        // Omit token unless we have one so we never clobber a stored token.
        token: tokenRef.current ?? undefined,
        timezone: getDeviceTimezone(),
        pushEnabled: pushOn,
        weeklyProgressEnabled: settings.weeklyProgress,
      });
    })();

    return () => {
      cancelled = true;
    };
    // `register` is stable; re-run only when the synced preferences change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, settings.pushNotifications, settings.weeklyProgress]);

  return null;
}

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const lastHandledResponseId = useRef<string | null>(null);

  // One-time setup: handler + channel + hydrate persisted settings.
  useEffect(() => {
    void installNotificationHandler();
    void hydrateSettings();
  }, []);

  // Route a notification tap to its target screen.
  const handleResponse = useCallback(
    (response: NotificationsTypes.NotificationResponse | null) => {
      if (!response) return;
      if (response.notification.request.identifier === lastHandledResponseId.current) return;
      lastHandledResponseId.current = response.notification.request.identifier;
      const route = response.notification.request.content.data?.route;
      if (typeof route === 'string' && route.length > 0) {
        router.push(route as never);
      }
    },
    [router],
  );

  useEffect(() => {
    if (!notificationsModule) return; // native module unavailable — no taps to route
    // Cold start from a notification tap.
    notificationsModule.getLastNotificationResponseAsync().then(handleResponse);
    const sub = notificationsModule.addNotificationResponseReceivedListener(handleResponse);
    return () => sub.remove();
  }, [handleResponse]);

  return (
    <>
      {isSignedIn ? <NotificationScheduler /> : null}
      {children}
    </>
  );
}
