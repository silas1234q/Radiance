import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useApi } from './useApi';

export function useAutoSaveSkinLog() {
  const api = useApi();
  const queryClient = useQueryClient();
  const [logId, setLogId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const latestData = useRef<Record<string, any>>({});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef(false);

  const doSave = useCallback(async () => {
    const data = { ...latestData.current };
    if (Object.keys(data).length === 0) return;

    setIsSaving(true);
    try {
      const result = await api.fetch('/skin-logs/today', {
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
  }, [api]);

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
