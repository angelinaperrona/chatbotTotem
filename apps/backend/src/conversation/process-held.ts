import {
  clearHeldMessages,
  getAggregatedHeldMessages,
} from "./held-messages.ts";
import { handleMessage } from "./handler.ts";

/**
 * Process all held messages from maintenance mode
 *
 * Groups messages by user and aggregates them
 * to ensure the state machine processes all user context at once.
 *
 * @returns Number of users processed
 */
export async function processHeldMessages(): Promise<{
  usersProcessed: number;
  messagesProcessed: number;
  errors: number;
}> {
  const aggregatedGroups = getAggregatedHeldMessages();

  if (aggregatedGroups.length === 0) {
    return { usersProcessed: 0, messagesProcessed: 0, errors: 0 };
  }

  console.log(
    `[HeldMessages] Processing ${aggregatedGroups.length} users with held messages`,
  );

  const processedIds: number[] = [];
  let errorCount = 0;

  for (const group of aggregatedGroups) {
    try {
      console.log(
        `[HeldMessages] Processing ${group.message_count} messages for ${group.phone_number}`,
      );

      // Process all messages for this user at once
      await handleMessage({
        phoneNumber: group.phone_number,
        content: group.aggregated_text,
        timestamp: group.oldest_timestamp,
        messageId: group.latest_message_id,
      });

      // Track IDs for cleanup
      const ids = group.message_ids.split(",").map((id) => parseInt(id, 10));
      processedIds.push(...ids);
    } catch (error) {
      errorCount++;
      console.error(
        `[HeldMessages] Failed to process messages for ${group.phone_number}:`,
        error,
      );
      // Continue with next user, don't mark failed ones as processed
    }
  }

  // Clear successfully processed messages
  if (processedIds.length > 0) {
    clearHeldMessages(processedIds);
  }

  const result = {
    usersProcessed: aggregatedGroups.length - errorCount,
    messagesProcessed: processedIds.length,
    errors: errorCount,
  };

  console.log(`[HeldMessages] Completed:`, result);

  return result;
}
