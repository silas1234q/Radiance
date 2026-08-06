/**
 * The API base URL, in its own module so `lib/connectivity.ts` can build the
 * health-probe URL without importing `apiClient.ts` (which imports connectivity
 * back to report transport failures — that would be a cycle).
 */
const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

/** Root of the API, e.g. `https://api.example.com/api`. */
export function getBaseUrl() {
  return `${BASE_URL}/api`;
}
