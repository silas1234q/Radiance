import * as SecureStore from 'expo-secure-store';
import { TokenCache } from '@clerk/clerk-expo';

// Keep the Clerk token readable after the first unlock following a reboot — the
// app wakes in the background for notifications, and the default
// (WHEN_UNLOCKED) makes the keychain item unreadable while the device is locked,
// which can surface as an unexpected signed-out state.
const KEYCHAIN_OPTS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
};

export const tokenCache: TokenCache = {
  async getToken(key: string) {
    try {
      return await SecureStore.getItemAsync(key, KEYCHAIN_OPTS);
    } catch {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      await SecureStore.setItemAsync(key, value, KEYCHAIN_OPTS);
    } catch {
      // silently fail
    }
  },
  async clearToken(key: string) {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      // silently fail
    }
  },
};
