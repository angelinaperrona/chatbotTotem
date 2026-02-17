import type {
  ConversationPhase,
  TransitionResult,
  ConversationMetadata,
  EnrichmentResult,
} from "../types.ts";
import { isCasualGreeting, isFormalGreeting } from "../../messaging/tone-detector.ts";

type EscalatedPhase = Extract<ConversationPhase, { phase: "escalated" }>;

export function transitionEscalated(
  phase: EscalatedPhase,
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
          metadata: { from_escalated: true, escalationReason: phase.reason },
        },
      ],
    };
  }

  // For all other messages, stay in escalated state
  return { type: "update", nextPhase: phase, commands: [] };
}
