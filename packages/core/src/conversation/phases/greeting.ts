/**
 * Greeting phase transition
 */

import type { ConversationMetadata, TransitionResult } from "../types.ts";
import { selectVariant } from "../../messaging/variation-selector.ts";
import * as T from "../../templates/standard.ts";

export function transitionGreeting(
  metadata: ConversationMetadata,
): TransitionResult {
  // Check if returning user had previous interest
  if (metadata.lastCategory) {
    const variants = T.GREETING_RETURNING(metadata.lastCategory);
    const { message } = selectVariant(variants, "GREETING_RETURNING", {});

    return {
      type: "advance",
      nextPhase: { phase: "confirming_client" },
      response: message,
      track: { eventType: "session_start", metadata: { returning: true } },
    };
  }

  const { message } = selectVariant(T.GREETING, "GREETING", {});

  return {
    type: "advance",
    nextPhase: { phase: "confirming_client" },
    response: message,
    track: { eventType: "session_start", metadata: { returning: false } },
  };
}
