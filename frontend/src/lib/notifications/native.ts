/**
 * Defensive loader for the expo-notifications native module.
 *
 * `expo-notifications` throws at import time when its native module isn't in the
 * running binary (Expo Go, or a dev build made before the dependency was added).
 * We `require` it inside a try/catch so that situation degrades to "reminders
 * disabled" instead of crashing the entire app. Every other file in this folder
 * goes through `notificationsModule` and no-ops when it's null.
 *
 * Types are imported with `import type` (erased at compile time), so referencing
 * them never triggers the native module load.
 */
export type NotificationsModule = typeof import('expo-notifications');

let mod: NotificationsModule | null = null;
let loadError: unknown = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  mod = require('expo-notifications') as NotificationsModule;
} catch (err) {
  loadError = err;
}

export const notificationsModule = mod;
export const notificationsAvailable = mod != null;

if (!notificationsAvailable) {
  console.warn(
    '[notifications] expo-notifications native module unavailable — reminders are ' +
      'disabled. This is expected in Expo Go; build a development client to enable them.',
    loadError,
  );
}
