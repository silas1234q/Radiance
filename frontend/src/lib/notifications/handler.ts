/**
 * One-time notification handler + Android channel setup.
 *
 * `setNotificationHandler` controls how a notification is presented while the
 * app is foregrounded. On Android we also register a "reminders" channel so
 * scheduled reminders have a stable importance/appearance.
 *
 * No-ops when the native module is unavailable (see ./native).
 */
import { Platform } from 'react-native';
import { notificationsModule as Notifications } from './native';

const CHANNEL_ID = 'reminders';

export function getRemindersChannelId(): string {
  return CHANNEL_ID;
}

let handlerInstalled = false;

export async function installNotificationHandler(): Promise<void> {
  if (handlerInstalled || !Notifications) return;
  handlerInstalled = true;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/**
 * (Re-)create the Android notification channel.
 * Called on every reconcile so the channel is always present.
 */
export async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android' || !Notifications) return;

  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
  });
}
