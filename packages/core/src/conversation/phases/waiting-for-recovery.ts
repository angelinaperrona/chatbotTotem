import type {
  ConversationPhase,
  TransitionResult,
  ConversationMetadata,
  EnrichmentResult,
} from "../types.ts";
import { isCasualGreeting, isFormalGreeting } from "../../messaging/tone-detector.ts";

type WaitingForRecoveryPhase = Extract<
  ConversationPhase,
  { phase: "waiting_for_recovery" }
>;

export function transitionWaitingForRecovery(
  phase: WaitingForRecoveryPhase,
  message: string,
  _metadata: ConversationMetadata,
  _enrichment?: EnrichmentResult,
): TransitionResult {
  const normalized = message.toLowerCase().trim();

  // Detect greeting to restart conversation
  if (isCasualGreeting(normalized) || isFormalGreeting(normalized)) {
    return {
      type: "update",
      nextPhase: { phase: "greeting" },
      commands: [
        {
          type: "TRACK_EVENT",
          event: "greeting_restart",
          metadata: { from_waiting_for_recovery: true },
        },
      ],
    };
  }

  // For all other messages, stay in recovery state
  return { type: "update", nextPhase: phase, commands: [] };
}
