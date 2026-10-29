import AsyncStorage from "@react-native-async-storage/async-storage";

const SEEN_KEY = "sm:welcome:seen";

/**
 * Tracks whether the welcome/landing screen has ever been shown on this
 * install.
 *
 * Deliberately kept out of onboardingCache: resetOnboardingCache() runs on
 * every sign-out, and this flag must survive that. Signing out should land the
 * user on auth, not back on the marketing pitch. AsyncStorage is cleared on
 * uninstall, so a genuine reinstall shows the welcome screen again.
 */
export async function hasSeenWelcome(): Promise<boolean> {
  const val = await AsyncStorage.getItem(SEEN_KEY);
  return val === "1";
}

export async function markWelcomeSeen(): Promise<void> {
  await AsyncStorage.setItem(SEEN_KEY, "1");
}

/** Only for development / "reset app state" tooling. */
export async function clearWelcomeSeen(): Promise<void> {
  await AsyncStorage.removeItem(SEEN_KEY);
}
