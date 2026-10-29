/**
 * Module-level access to Clerk's token getter.
 *
 * Hooks get their token straight from `useAuth()`, but the offline mutation
 * queue replays writes from plain module code (see `lib/mutationDefaults.ts`) —
 * a mutation restored from AsyncStorage has no React context to pull from. This
 * is the bridge: `AuthRouter` registers Clerk's getter here on every auth change
 * and non-hook callers read it from anywhere.
 */
export type ClerkGetToken = (options?: { skipCache?: boolean }) => Promise<string | null>;

export interface AuthSource {
  getToken: ClerkGetToken;
  isSignedIn: boolean | undefined;
}

let getTokenFn: ClerkGetToken | null = null;
let signedIn: boolean | undefined;

let resolveReady!: () => void;
let ready = new Promise<void>((r) => (resolveReady = r));

export function setClerkAuth(getToken: ClerkGetToken, isSignedIn: boolean | undefined): void {
  getTokenFn = getToken;
  signedIn = isSignedIn;
}

/** The registered auth source. `getToken` resolves null until Clerk registers. */
export function getAuthSource(): AuthSource {
  return {
    getToken: async (options) => {
      if (!getTokenFn) return null;
      try {
        return await getTokenFn(options);
      } catch {
        // Clerk throws rather than resolving null when it can't reach its API.
        return null;
      }
    },
    isSignedIn: signedIn,
  };
}


export const markBackendReady = () => resolveReady();
export const resetBackendReady = () => {
  ready = new Promise<void>((r) => (resolveReady = r));
};

// Waits for sync to finish, but never hangs forever if sync failed.
export const waitForBackendReady = (timeoutMs = 8000) =>
  new Promise<void>((resolve) => {
    const t = setTimeout(resolve, timeoutMs);
    ready.then(() => {
      clearTimeout(t);
      resolve();
    });
  });