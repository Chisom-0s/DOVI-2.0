// Toast deduplication utility — prevents stacked duplicate notifications within 3.5s window
import toast, { ToastOptions } from 'react-hot-toast';

const originalError = toast.error.bind(toast);

const recentErrors = new Map<string, number>();
const DEDUPE_WINDOW_MS = 3500; // 3.5 seconds

// Wrap toast.error to deduplicate identical errors
toast.error = (message: any, options?: ToastOptions): string => {
  const text = typeof message === 'string' ? message : (message?.toString?.() || 'Error occurred');
  const key = text.trim().toLowerCase();
  const now = Date.now();
  const lastTime = recentErrors.get(key);

  if (lastTime && (now - lastTime) < DEDUPE_WINDOW_MS) {
    // Suppress duplicate within window, but return active toast id
    return options?.id || `dedupe-${key.slice(0, 40)}`;
  }

  recentErrors.set(key, now);

  // Periodic cleanup of stale entries
  if (recentErrors.size > 50) {
    for (const [k, t] of recentErrors.entries()) {
      if (now - t > DEDUPE_WINDOW_MS * 2) {
        recentErrors.delete(k);
      }
    }
  }

  const toastId = options?.id || `dedupe-${key.slice(0, 40)}`;
  return originalError(message, { id: toastId, ...options });
};

export default toast;
