/**
 * App-readiness signal for the animated splash.
 *
 * `AuthRouter` flips this to true once it has resolved auth and performed the
 * initial `router.replace` to the destination screen, so the splash overlay
 * knows the correct screen is mounted underneath and it's safe to fade out.
 * Tiny external store (same shape as the notification settings store).
 */
type Listener = () => void;

let navReady = false;
const listeners = new Set<Listener>();

export function getNavReady(): boolean {
  return navReady;
}

export function setNavReady(): void {
  if (navReady) return;
  navReady = true;
  for (const l of listeners) l();
}

export function subscribeNavReady(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
