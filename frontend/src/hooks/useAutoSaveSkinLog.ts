import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from './useApi';
import { getIsOnline } from '../lib/connectivity';
import { MUTATION_KEYS, type AutoSaveSkinLogVars } from '../lib/mutationDefaults';
import type { SkinLog } from '../types/api';

export function useAutoSaveSkinLog() {
  const api = useApi();
  const queryClient = useQueryClient();
  const [logId, setLogId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const latestData = useRef<Record<string, any>>({});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef(false);

  // Offline fallback only. Paused mutations don't settle until we reconnect, so
  // this is fire-and-forget — awaiting it would hang `flush()` on modal close
  // and leave the "Saving…" indicator up forever.
  const { mutate: enqueueSave } = useMutation<SkinLog, unknown, AutoSaveSkinLogVars>({
    mutationKey: MUTATION_KEYS.autoSaveSkinLog,
  });

  const doSave = useCallback(async () => {
    const data = { ...latestData.current };
    if (Object.keys(data).length === 0) return;

    if (!getIsOnline()) {
      // Hand the write to the offline queue; it replays on reconnect.
      enqueueSave(data);
      pendingRef.current = false;
      return;
    }

    setIsSaving(true);
    try {
      const result = await api.fetch<SkinLog>('/skin-logs/today', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      if (result?.id) setLogId(result.id);
      pendingRef.current = false;
      queryClient.invalidateQueries({ queryKey: ['skinLogs', 'today'] });
    } catch (e) {
      console.warn('Auto-save failed:', e);
    } finally {
      setIsSaving(false);
    }
  }, [api, queryClient, enqueueSave]);

  const save = useCallback(
    (fields: Record<string, any>) => {
      Object.assign(latestData.current, fields);
      pendingRef.current = true;

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(doSave, 1500);
    },
    [doSave],
  );

  const saveImmediate = useCallback(
    async (fields: Record<string, any>) => {
      Object.assign(latestData.current, fields);
      pendingRef.current = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      await doSave();
    },
    [doSave],
  );

  const flush = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (pendingRef.current) {
      await doSave();
    }
  }, [doSave]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { save, saveImmediate, logId, isSaving, flush };
}
