/**
 * React view of the connectivity store in `lib/connectivity.ts`.
 *
 * The store is deliberately plain-module state so it works from `apiClient` and
 * the toast helper, which aren't components. This is the bridge for the places
 * that *are* — chiefly the cold-start gate, which needs to notice when the
 * network comes back on its own.
 */
import { useSyncExternalStore } from 'react';
import { getReachability, subscribeConnectivity, type Reachability } from '../lib/connectivity';

export function useReachability(): Reachability {
  return useSyncExternalStore(subscribeConnectivity, getReachability, getReachability);
}
