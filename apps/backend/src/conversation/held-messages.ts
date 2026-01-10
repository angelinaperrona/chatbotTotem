import { db } from "../db/index.ts";
import { getAll } from "../db/query.ts";

type AggregatedHeldGroup = {
  phone_number: string;
  message_ids: string;
  aggregated_text: string;
  oldest_timestamp: number;
  latest_message_id: string;
  message_count: number;
};

/**
 * Store a message received during maintenance mode
 */
export function holdMessage(
  phoneNumber: string,
  text: string,
  messageId: string,
  whatsappTimestamp: number,
): void {
  db.prepare(
    `INSERT INTO held_messages (phone_number, message_text, message_id, whatsapp_timestamp)
     VALUES (?, ?, ?, ?)`,
  ).run(phoneNumber, text, messageId, whatsappTimestamp);

  console.log(
    `[HeldMessages] Stored message from ${phoneNumber} during maintenance`,
  );
}

/**
 * Get held messages aggregated by user (like aggregator-worker does)
 */
export function getAggregatedHeldMessages(): AggregatedHeldGroup[] {
  return getAll<AggregatedHeldGroup>(
    `SELECT 
       phone_number,
       GROUP_CONCAT(id) as message_ids,
       GROUP_CONCAT(message_text, ' ') as aggregated_text,
       MIN(whatsapp_timestamp) as oldest_timestamp,
       MAX(message_id) as latest_message_id,
       COUNT(*) as message_count
     FROM held_messages
     GROUP BY phone_number
     ORDER BY MIN(created_at) ASC`,
  );
}

/**
 * Delete held messages after processing
 */
export function clearHeldMessages(ids: number[]): void {
  if (ids.length === 0) return;

  const placeholders = ids.map(() => "?").join(",");
  db.prepare(`DELETE FROM held_messages WHERE id IN (${placeholders})`).run(
    ...ids,
  );

  console.log(`[HeldMessages] Cleared ${ids.length} processed messages`);
}

/**
 * Count held messages (for monitoring)
 */
export function countHeldMessages(): number {
  const result = db
    .prepare(`SELECT COUNT(*) as count FROM held_messages`)
    .get() as { count: number };
  return result.count;
}
