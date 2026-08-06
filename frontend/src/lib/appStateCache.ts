import AsyncStorage from "@react-native-async-storage/async-storage";

const APP_STATE_KEY = "radiance:app-state";
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface CachedAppState {
  isSignedIn: boolean;
  isOnboarded: boolean;
  userId: string;
  cachedAt: number;
}

export async function getAppState(): Promise<CachedAppState | null> {
  try {
    const raw = await AsyncStorage.getItem(APP_STATE_KEY);
    if (!raw) return null;
    const state: CachedAppState = JSON.parse(raw);
    if (Date.now() - state.cachedAt > MAX_AGE_MS) return null;
    return state;
  } catch {
    return null;
  }
}

export async function setAppState(state: Omit<CachedAppState, "cachedAt">): Promise<void> {
  try {
    await AsyncStorage.setItem(
      APP_STATE_KEY,
      JSON.stringify({ ...state, cachedAt: Date.now() }),
    );
  } catch {}
}

/**
 * Flips the cached `isOnboarded` flag once the user has actually onboarded.
 *
 * Without this the cache keeps whatever was true at sign-in — `false` for a new
 * account — and the next cold start optimistically navigates to the quiz before
 * the backend correction lands, which is the "onboarding flashes before home"
 * bug. Deliberately a no-op when there's no record: the sign-in write in
 * `AuthRouter` owns creating it.
 */
export async function markOnboarded(): Promise<void> {
  const current = await getAppState();
  if (!current || current.isOnboarded) return;
  await setAppState({
    isSignedIn: current.isSignedIn,
    isOnboarded: true,
    userId: current.userId,
  });
}

export async function clearAppState(): Promise<void> {
  try {
    await AsyncStorage.removeItem(APP_STATE_KEY);
  } catch {}
}
