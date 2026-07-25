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

export const REMINDERS_CHANNEL_ID = 'reminders';

let installed = false;

export async function installNotificationHandler(): Promise<void> {
  if (installed || !Notifications) return;
  installed = true;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(REMINDERS_CHANNEL_ID, {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
    });
  }
}
