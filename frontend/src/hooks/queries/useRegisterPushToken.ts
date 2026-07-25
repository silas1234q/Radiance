import { useMutation } from '@tanstack/react-query';
import { useApi } from '../useApi';

export interface PushRegistrationInput {
  token?: string | null;
  timezone?: string;
  pushEnabled?: boolean;
  weeklyProgressEnabled?: boolean;
  winbackEnabled?: boolean;
}

/**
 * Persist this device's Expo push token + server-push preferences.
 * Errors are swallowed by the mutation cache's default toast opt-out — a failed
 * registration should never surface UI (local notifications still work).
 */
export function useRegisterPushToken() {
  const api = useApi();
  return useMutation({
    mutationFn: (input: PushRegistrationInput) =>
      api.fetch('/users/me/push-token', {
        method: 'PUT',
        body: JSON.stringify(input),
      }),
    meta: { suppressErrorToast: true },
  });
}
