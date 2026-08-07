import Toast from 'react-native-toast-message';
import { awaitReachability } from './connectivity';
import { getErrorMessage, isNetworkError } from './errors';

// Many requests can fail at once when offline, and the state persists for as
// long as the user has no signal — so one toast per window, and a window wide
// enough that navigating around offline doesn't re-nag on every screen.
const NETWORK_TOAST_THROTTLE_MS = 20_000;
let lastNetworkToastAt = 0;

interface ToastOptions {
  /** Overrides the default heading (text1). */
  title?: string;
  /** Visibility duration in ms. */
  duration?: number;
}

/**
 * App-wide toast helper. Screens import this instead of `react-native-toast-message`
 * directly so headings/variants stay consistent. The underlying host + theming live in
 * `components/ui/toastConfig.tsx`, mounted once in `app/_layout.tsx`.
 */
export const toast = {
  error(message: string, opts: ToastOptions = {}) {
    Toast.show({
      type: 'error',
      text1: opts.title ?? 'Something went wrong',
      text2: message,
      visibilityTime: opts.duration ?? 4000,
    });
  },

  success(message: string, opts: ToastOptions = {}) {
    Toast.show({
      type: 'success',
      text1: opts.title ?? 'Success',
      text2: message,
      visibilityTime: opts.duration ?? 2500,
    });
  },

  info(message: string, opts: ToastOptions = {}) {
    Toast.show({
      type: 'info',
      text1: opts.title ?? 'Heads up',
      text2: message,
      visibilityTime: opts.duration ?? 3000,
    });
  },

  /**
   * Primary call site for catch blocks and the global mutation error handler.
   *
   * A failed request is not proof that the user is offline — a single dropped
   * connection on a working network looks identical from here. So we ask the
   * connectivity probe first and word the toast for what actually happened.
   * Telling someone on a slow-but-working connection to "check your internet"
   * is both wrong and the most annoying thing this app can say.
   */
  fromError(err: unknown, opts: ToastOptions = {}) {
    if (!isNetworkError(err)) {
      // Timeouts and bad payloads carry their own copy via `getErrorMessage`.
      this.error(getErrorMessage(err), opts);
      return;
    }

    const now = Date.now();
    if (now - lastNetworkToastAt < NETWORK_TOAST_THROTTLE_MS) return;
    // Claim the slot before awaiting, so a burst of concurrent failures can't
    // all get through while the probe is still in flight.
    lastNetworkToastAt = now;

    void awaitReachability().then((state) => {
      switch (state) {
        case 'no-radio':
          this.error('Check your mobile data or Wi-Fi and try again.', {
            title: "You're offline",
            ...opts,
          });
          break;
        case 'no-backend':
          // Our fault, not theirs — don't send them to fiddle with their router.
          this.error("We're having trouble connecting. Please try again in a moment.", {
            title: "Can't reach Radiance",
            ...opts,
          });
          break;
        case 'unknown':
          // The probe hasn't answered either way within the wait. Something is
          // slow; say that much and nothing more.
          this.error('Your connection seems slow. Please try again.', {
            title: 'Connection problem',
            ...opts,
          });
          break;
        case 'online':
          // Confirmed reachable, so this one request just failed. This is the
          // case that used to lie about the user's connection.
          lastNetworkToastAt = 0; // a one-off shouldn't eat the whole window
          this.error("That didn't go through. Please try again.", {
            title: 'Something went wrong',
            ...opts,
          });
          break;
      }
    });
  },
};
