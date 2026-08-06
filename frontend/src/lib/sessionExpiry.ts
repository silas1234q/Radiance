import { getIsOnline } from './connectivity';

type Listener = () => void;

let listener: Listener | null = null;
let suppressed = false;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

// Auth hasn't been confirmed yet on cold start. Until Phase 2 in _layout.tsx
// calls markAuthSettled(), session-expired emissions are suppressed so a brief
// isSignedIn===false during Clerk token refresh doesn't wipe user data.
let authSettled = false;

const DEBOUNCE_MS = 5_000;

export function emitSessionExpired() {
  if (suppressed || !authSettled) return;
  // Final backstop: a session can only be *known* expired if we can reach the
  // backend. Offline, Clerk can't refresh its token and everything looks like a
  // dead session — signing the user out there is the bug we're guarding.
  if (!getIsOnline()) return;
  // Collapse rapid duplicate emissions into one; the first fires after the
  // debounce window, and subsequent calls within the window are no-ops.
  if (debounceTimer) return;
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
  }, DEBOUNCE_MS);
  listener?.();
}

/** Mark that the initial auth state has been confirmed by AuthRouter Phase 2. */
export function markAuthSettled() {
  authSettled = true;
}

export function onSessionExpired(fn: Listener): () => void {
  listener = fn;
  return () => {
    if (listener === fn) listener = null;
  };
}

/** Suppress session-expired side effects during intentional sign-out. */
export function suppressSessionExpiry() {
  suppressed = true;
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
}

export function isSessionExpirySuppressed() {
  return suppressed;
}

export function resetSessionExpiry() {
  suppressed = false;
  // authSettled is intentionally NOT reset here — it stays true once the first
  // Phase 2 confirmation has run, so subsequent sign-out→sign-in cycles still
  // emit session-expired correctly. It only resets on a full app restart
  // (module re-init).
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
}
