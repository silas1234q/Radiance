/**
 * React binding over the notification settings store.
 *
 * Reading is reactive via `useSyncExternalStore`; writing goes through the
 * store so the `NotificationsProvider` (subscribed to the same store)
 * re-reconciles scheduled notifications automatically.
 */
import { useCallback, useEffect, useSyncExternalStore } from 'react';
import {
  NotificationSettings,
  getSettings,
  hydrateSettings,
  isHydrated,
  subscribeSettings,
  updateSettings,
} from '../lib/notifications';

export function useNotificationSettings() {
  const settings = useSyncExternalStore(subscribeSettings, getSettings, getSettings);
  const loaded = useSyncExternalStore(subscribeSettings, isHydrated, isHydrated);

  useEffect(() => {
    void hydrateSettings();
  }, []);

  const update = useCallback(
    <K extends keyof NotificationSettings>(key: K, value: NotificationSettings[K]) => {
      updateSettings({ [key]: value } as Partial<NotificationSettings>);
    },
    [],
  );

  const setMany = useCallback((patch: Partial<NotificationSettings>) => {
    updateSettings(patch);
  }, []);

  return { settings, loaded, update, setMany };
}
