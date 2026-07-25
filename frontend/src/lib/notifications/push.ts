/**
 * Expo push-token acquisition for server-driven notifications (Phase 2).
 *
 * `getExpoPushToken` needs the EAS projectId; if it isn't configured yet
 * (no `eas init`), we return null so the rest of the app — including all local
 * notifications — keeps working without a remote token.
 */
import Constants from 'expo-constants';
import { notificationsModule as Notifications } from './native';

function getProjectId(): string | undefined {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants as unknown as { easConfig?: { projectId?: string } }).easConfig?.projectId
  );
}

/** IANA timezone of the device (e.g. "Africa/Accra"), best-effort. */
export function getDeviceTimezone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
  } catch {
    return undefined;
  }
}

/** Fetch this device's Expo push token, or null if unavailable/misconfigured. */
export async function getExpoPushToken(): Promise<string | null> {
  if (!Notifications) return null;
  const projectId = getProjectId();
  if (!projectId) {
    console.warn(
      '[push] No EAS projectId configured — skipping push token registration. ' +
        'Run `eas init` and set expo.extra.eas.projectId to enable server push.',
    );
    return null;
  }
  try {
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    return data ?? null;
  } catch (err) {
    console.warn('[push] Failed to get Expo push token:', err);
    return null;
  }
}
