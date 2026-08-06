import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Pull-to-refresh state for a screen's `RefreshControl`.
 *
 * Invalidating without a filter refetches everything currently on screen and
 * marks the rest stale, so whichever tab the user pulls on comes back fresh —
 * and so do the tabs they switch to next.
 *
 * Offline this settles rather than hanging: `networkMode: 'offlineFirst'` still
 * runs the first attempt, and network errors aren't retried (see the query
 * defaults in `app/_layout.tsx`), so the spinner always goes away.
 */
export function useRefreshQueries() {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await queryClient.invalidateQueries();
    } catch {
      // Individual failures already surface through the query error handlers.
    } finally {
      setRefreshing(false);
    }
  }, [queryClient]);

  return { refreshing, onRefresh };
}
