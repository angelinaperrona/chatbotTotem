const RESPONSE_DELAY_MS = parseInt(
  process.env.BOT_RESPONSE_DELAY_MS || "2300",
  10,
);
const BACKLOG_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

export function isBacklogged(messageTimestamp: number): boolean {
  const messageAgeMs = Date.now() - messageTimestamp;
  return messageAgeMs > BACKLOG_THRESHOLD_MS;
}

// Calculate response delay for natural pacing.
// Returns 0 if message is backlogged or processing time already exceeded delay.
export function calculateResponseDelay(
  messageTimestamp: number,
  processingStartTime: number,
): number {
  if (isBacklogged(messageTimestamp)) {
    return 0;
  }

  if (RESPONSE_DELAY_MS <= 0) {
    return 0;
  }

  const elapsed = processingStartTime - messageTimestamp;
  const remainingDelay = Math.max(0, RESPONSE_DELAY_MS - elapsed);

  return remainingDelay;
}
