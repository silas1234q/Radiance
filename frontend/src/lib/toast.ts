import Toast from 'react-native-toast-message';
import { getErrorMessage, isNetworkError } from './errors';

// Many requests can fail at once when offline; only surface one network toast
// per window so the screen isn't flooded with identical banners.
const NETWORK_TOAST_THROTTLE_MS = 5000;
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

  /** Primary call site for catch blocks and the global mutation error handler. */
  fromError(err: unknown, opts: ToastOptions = {}) {
    if (isNetworkError(err)) {
      const now = Date.now();
      if (now - lastNetworkToastAt < NETWORK_TOAST_THROTTLE_MS) return;
      lastNetworkToastAt = now;
      this.error(getErrorMessage(err), { title: 'No connection', ...opts });
      return;
    }
    this.error(getErrorMessage(err), opts);
  },
};
