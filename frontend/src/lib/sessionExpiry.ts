type Listener = () => void;

let listener: Listener | null = null;
let suppressed = false;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

const DEBOUNCE_MS = 5_000;

export function emitSessionExpired() {
  if (suppressed) return;
  // Collapse rapid duplicate emissions into one; the first fires after the
  // debounce window, and subsequent calls within the window are no-ops.
  if (debounceTimer) return;
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
  }, DEBOUNCE_MS);
  listener?.();
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

export function resetSessionExpiry() {
  suppressed = false;
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
}
