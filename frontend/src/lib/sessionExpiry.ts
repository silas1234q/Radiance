type Listener = () => void;

let listener: Listener | null = null;
let fired = false;

export function emitSessionExpired() {
  if (fired) return;
  fired = true;
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
  fired = true;
}

export function resetSessionExpiry() {
  fired = false;
}
