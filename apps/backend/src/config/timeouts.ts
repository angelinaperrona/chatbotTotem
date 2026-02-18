// Values are in milliseconds
export const TIMEOUTS = {
  // Conversation locks
  LOCK_DEFAULT: 30_000,
  LOCK_ELIGIBILITY: 60_000,

  // External API calls
  FNB_AUTH: 10_000,
  FNB_QUERY: 15_000,

  // WhatsApp API
  WHATSAPP_SEND: 10_000,
  WHATSAPP_IMAGE: 15_000,

  // Notifier service
  NOTIFIER: 5_000,
} as const;

/**
 * Helper to create timeout promise
 * Usage: Promise.race([operation(), createTimeout(5000, 'Operation')])
 */
export function createTimeout(ms: number, operation: string): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Timeout: ${operation} exceeded ${ms}ms`));
    }, ms);
  });
}

/**
 * Helper to create AbortController with timeout
 * Automatically cleans up timer
 */
export function createAbortTimeout(ms: number): {
  signal: AbortSignal;
  cleanup: () => void;
} {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ms);

  return {
    signal: controller.signal,
    cleanup: () => clearTimeout(timeoutId),
  };
}
