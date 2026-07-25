/**
 * Tiny external store for notification settings.
 *
 * Both the settings screen (`useNotificationSettings`) and the
 * `NotificationsProvider` observe the same source, so a change in Settings
 * immediately triggers a reconcile. Persisted to AsyncStorage; hydrated once on
 * first import.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  NOTIFICATION_SETTINGS_KEY,
  NotificationSettings,
  normalizeSettings,
} from './settings';

type Listener = () => void;

let state: NotificationSettings = { ...DEFAULT_NOTIFICATION_SETTINGS };
let hydrated = false;
const listeners = new Set<Listener>();

function emit() {
  for (const l of listeners) l();
}

export function getSettings(): NotificationSettings {
  return state;
}

export function isHydrated(): boolean {
  return hydrated;
}

export function subscribeSettings(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Load persisted settings once. Safe to call repeatedly. */
export async function hydrateSettings(): Promise<NotificationSettings> {
  if (hydrated) return state;
  try {
    const raw = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    if (raw) state = normalizeSettings(JSON.parse(raw));
  } catch {
    // keep defaults on parse/storage failure
  }
  hydrated = true;
  emit();
  return state;
}

async function persist() {
  try {
    await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(state));
  } catch {
    // best-effort; in-memory state stays authoritative for this session
  }
}

/** Merge a partial update, persist, and notify subscribers. */
export function updateSettings(patch: Partial<NotificationSettings>): NotificationSettings {
  state = { ...state, ...patch };
  emit();
  void persist();
  return state;
}
