type DebouncedMessage = {
  phoneNumber: string;
  messages: Array<{ text: string; timestamp: number }>;
  timeoutId: Timer;
};

const DEBOUNCE_DELAY_MS = 3000;
const messageBuffers = new Map<string, DebouncedMessage>();

type ProcessCallback = (
  phoneNumber: string,
  aggregatedText: string,
  metadata: { isBacklog: boolean; oldestMessageAge: number },
) => void;

export function debounceMessage(
  phoneNumber: string,
  messageText: string,
  timestamp: number, // Unix timestamp from WhatsApp
  onProcess: ProcessCallback,
): void {
  const existing = messageBuffers.get(phoneNumber);

  if (existing) {
    clearTimeout(existing.timeoutId);
    existing.messages.push({ text: messageText, timestamp });
  } else {
    messageBuffers.set(phoneNumber, {
      phoneNumber,
      messages: [{ text: messageText, timestamp }],
      timeoutId: null as any,
    });
  }

  const buffer = messageBuffers.get(phoneNumber)!;
  buffer.timeoutId = setTimeout(() => {
    const messages = buffer.messages;
    const aggregated = messages.map((m) => m.text).join(" ");

    // Detect backlog: oldest message is older than 10 minutes
    const now = Date.now();
    const oldestTimestamp = Math.min(
      ...messages.map((m) => m.timestamp * 1000),
    );
    const oldestMessageAge = now - oldestTimestamp;
    const isBacklog = oldestMessageAge > 10 * 60 * 1000; // 10 minutes

    messageBuffers.delete(phoneNumber);
    onProcess(phoneNumber, aggregated, { isBacklog, oldestMessageAge });
  }, DEBOUNCE_DELAY_MS);
}

export function clearDebounceBuffer(phoneNumber: string): void {
  const existing = messageBuffers.get(phoneNumber);
  if (existing) {
    clearTimeout(existing.timeoutId);
    messageBuffers.delete(phoneNumber);
  }
}
