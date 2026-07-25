/**
 * React Query → AsyncStorage persistence.
 *
 * Persists the query cache so reads work offline: on a cold start the cache is
 * rehydrated from AsyncStorage and screens render their last-known data even
 * with no network. Mutations are NOT persisted/queued — writes still require
 * the network and notify on failure (see the mutationCache handler in
 * _layout.tsx).
 *
 * `persister` is exported so AuthRouter can wipe the snapshot on sign-out / user
 * change (per-user isolation).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { defaultShouldDehydrateQuery, type Query } from '@tanstack/react-query';
import type { PersistQueryClientOptions } from '@tanstack/react-query-persist-client';

/** AsyncStorage key for the persisted cache (namespaced, no collisions). */
export const QUERY_CACHE_KEY = 'radiance:rq-cache';

/** How long persisted data is considered restorable. Must be ≤ queries.cacheTime. */
const MAX_AGE = 1000 * 60 * 60 * 24 * 7; // 7 days

export const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: QUERY_CACHE_KEY,
  throttleTime: 1000,
});

/**
 * Persist only successful queries, excluding volatile per-argument keys that
 * would balloon storage. Product *search* results (`['products','search',term]`)
 * are keyed per search term, so we skip them; everything else is kept.
 */
function shouldDehydrateQuery(query: Query): boolean {
  if (!defaultShouldDehydrateQuery(query)) return false;
  const key = query.queryKey;
  if (Array.isArray(key) && key[0] === 'products' && key[1] === 'search') return false;
  return true;
}

export const persistOptions: Omit<PersistQueryClientOptions, 'queryClient'> = {
  persister,
  maxAge: MAX_AGE,
  // Bump this to invalidate all persisted caches after a breaking data-shape change.
  buster: '1',
  dehydrateOptions: { shouldDehydrateQuery },
};
