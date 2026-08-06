/**
 * App-readiness signal for the animated splash.
 *
 * `AuthRouter` flips `navReady` to true once it has resolved auth and performed
 * the initial `router.replace` to the destination screen, so the splash overlay
 * knows the correct screen is mounted underneath and it's safe to fade out.
 *
 * `splashHold` is the opposite signal: while it's set the splash must not fade
 * out at all, not even on its own safety cap. The cold-start connectivity gate
 * (`hooks/useColdStartGate.ts`) uses it to keep the splash up while it decides
 * whether we can reach the backend, and to keep it up indefinitely with an alert
 * on top when we can't.
 *
 * Tiny external store (same shape as the notification settings store).
 */
type Listener = () => void;

let navReady = false;
let splashHold = false;
const listeners = new Set<Listener>();

function notify(): void {
  for (const l of listeners) l();
}

export function getNavReady(): boolean {
  return navReady;
}

export function setNavReady(): void {
  if (navReady) return;
  navReady = true;
  notify();
}

export function getSplashHold(): boolean {
  return splashHold;
}

export function setSplashHold(hold: boolean): void {
  if (splashHold === hold) return;
  splashHold = hold;
  notify();
}

export function subscribeNavReady(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
