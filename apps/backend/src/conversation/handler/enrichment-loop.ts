import type {
  ConversationPhase,
  ConversationMetadata,
  TransitionResult,
  EnrichmentResult,
} from "@totem/core";
import { transition } from "@totem/core";
import { executeEnrichment } from "../enrichment.ts";
import { updateConversation } from "../store.ts";

const MAX_ENRICHMENT_LOOPS = 10; // Safety limit

/**
 * Run the enrichment loop for state machine transitions.
 *
 * The state machine is pure and cannot make external calls. When it needs
 * external data (LLM, eligibility check, etc.), it returns "need_enrichment".
 * This function orchestrates the feedback loop until we get a final result.
 */
export async function runEnrichmentLoop(
  phase: ConversationPhase,
  message: string,
  metadata: ConversationMetadata,
  phoneNumber: string,
): Promise<TransitionResult> {
  let currentPhase = phase;
  let enrichment: EnrichmentResult | undefined;
  let iterations = 0;

  while (iterations < MAX_ENRICHMENT_LOOPS) {
    iterations++;

    const result = transition({
      phase: currentPhase,
      message,
      metadata,
      enrichment,
    });

    if (result.type !== "need_enrichment") {
      return result;
    }

    console.log(
      `[EnrichmentLoop] Enrichment needed: ${result.enrichment.type} (iteration ${iterations})`,
    );

    // Persist pending phase immediately to prevent state loss on crash
    if (result.pendingPhase) {
      currentPhase = result.pendingPhase;
      updateConversation(phoneNumber, currentPhase, metadata);
    }

    enrichment = await executeEnrichment(result.enrichment, phoneNumber);
  }

  // Safety: too many loops, escalate
  console.error(
    `[EnrichmentLoop] Max enrichment loops exceeded for ${phoneNumber}`,
  );
  return {
    type: "update",
    nextPhase: {
      phase: "escalated",
      reason: "enrichment_loop_exceeded",
    },
    commands: [
      {
        type: "NOTIFY_TEAM",
        channel: "dev",
        message: `Max enrichment loops for ${phoneNumber}`,
      },
      { type: "ESCALATE", reason: "enrichment_loop_exceeded" },
    ],
  };
}
