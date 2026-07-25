/**
 * Notification settings — shape, defaults, and the AsyncStorage key.
 *
 * These preferences drive the local scheduler (routine / daily-log / streak
 * reminders) and, in Phase 2, the server-push toggles. Times are stored as
 * "HH:mm" 24-hour strings so they're trivially JSON-serialisable and easy to
 * feed into a daily notification trigger.
 */

export const NOTIFICATION_SETTINGS_KEY = 'radiance_app_settings';

export interface NotificationSettings {
  /** Master switch for push/notifications (also gates Phase 2 server push). */
  pushNotifications: boolean;
  /** AM/PM routine reminders. */
  routineReminders: boolean;
  /** Evening nudge to log mood + skin when the day isn't a full day yet. */
  dailyLog: boolean;
  /** Evening reminder shown only when a streak is active and at risk. */
  streakProtection: boolean;
  /** Weekly progress summary (delivered via server push in Phase 2). */
  weeklyProgress: boolean;
  /** Default morning reminder time for the AM routine ("HH:mm"). */
  amTime: string;
  /** Default evening reminder time for the PM routine ("HH:mm"). */
  pmTime: string;
  /** Time for the evening daily-log / streak-protection nudge ("HH:mm"). */
  logTime: string;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  pushNotifications: true,
  routineReminders: true,
  dailyLog: true,
  streakProtection: true,
  weeklyProgress: true,
  amTime: '08:00',
  pmTime: '21:00',
  logTime: '20:30',
};

/** Merge stored (possibly partial / legacy) settings onto the defaults. */
export function normalizeSettings(raw: unknown): NotificationSettings {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_NOTIFICATION_SETTINGS };
  return { ...DEFAULT_NOTIFICATION_SETTINGS, ...(raw as Partial<NotificationSettings>) };
}

/** Parse "HH:mm" into { hour, minute }; falls back to the given default. */
export function parseTime(value: string | null | undefined, fallback = '08:00'): {
  hour: number;
  minute: number;
} {
  const source = value && /^\d{1,2}:\d{2}$/.test(value) ? value : fallback;
  const [h, m] = source.split(':');
  const hour = Math.min(23, Math.max(0, parseInt(h, 10) || 0));
  const minute = Math.min(59, Math.max(0, parseInt(m, 10) || 0));
  return { hour, minute };
}

/** Format a Date's local time as "HH:mm". */
export function formatTime(date: Date): string {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

/** Turn "HH:mm" into a Date today (used to seed a time picker). */
export function timeToDate(value: string): Date {
  const { hour, minute } = parseTime(value);
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
}
