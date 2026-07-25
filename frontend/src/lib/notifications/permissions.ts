/**
 * Permission helpers. Local scheduled notifications still require the OS
 * notification permission (Android 13+ and iOS both prompt).
 *
 * All calls resolve to `false` when the native module is unavailable.
 */
import { notificationsModule as Notifications } from './native';

export async function hasNotificationPermission(): Promise<boolean> {
  if (!Notifications) return false;
  const { granted } = await Notifications.getPermissionsAsync();
  return granted;
}

/**
 * Ensure permission, prompting the user if it hasn't been decided yet.
 * Returns true if we may post notifications.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!Notifications) return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  // `canAskAgain === false` means the user previously denied and iOS/Android
  // won't show the system prompt again — the caller should route to Settings.
  if (!current.canAskAgain) return false;

  const requested = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: false, allowSound: true },
  });
  return requested.granted;
}
