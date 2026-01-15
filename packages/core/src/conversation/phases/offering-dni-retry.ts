import type { ConversationMetadata, TransitionResult } from "../types.ts";
import { selectVariant } from "../../messaging/variation-selector.ts";
import { extractDNI } from "../../validation/regex.ts";
import * as T from "../../templates/standard.ts";

type OfferingDniRetryPhase = Extract<
  import("../types.ts").ConversationPhase,
  { phase: "offering_dni_retry" }
>;

export function transitionOfferingDniRetry(
  phase: OfferingDniRetryPhase,
  message: string,
  metadata: ConversationMetadata,
): TransitionResult {
  const lower = message.toLowerCase().trim();

  const attemptCount = (metadata.triedDnis?.length || 0) + 1;

  const dni = extractDNI(message);
  if (dni) {
    // Transition to collecting_dni phase which will handle deduplication
    return {
      type: "update",
      nextPhase: { phase: "collecting_dni" },
      commands: [],
    };
  }

  // User explicitly declines retry
  const isNegative =
    /^(no|nop|nope|negativo|nada|no\s+tengo|ya\s+no)$/i.test(lower) ||
    /\b(no\s+quiero|no\s+tengo|no\s+puedo)\b/.test(lower);

  if (isNegative) {
    const { message: messages } = selectVariant(
      [
        ["Entiendo. Si en el futuro cambias de opinión, aquí estaré 😊"],
        [
          "Está bien. Gracias por tu tiempo. Cualquier cosa, nos vuelves a escribir.",
        ],
        [
          "Sin problema. Si más adelante quieres revisar otra opción, no dudes en contactarnos.",
        ],
      ],
      "DNI_RETRY_DECLINED",
      {},
    );

    return {
      type: "update",
      nextPhase: { phase: "closing", purchaseConfirmed: false },
      commands: [
        {
          type: "TRACK_EVENT",
          event: "dni_retry_declined",
          metadata: { attemptCount },
        },
        ...messages.map((text) => ({ type: "SEND_MESSAGE" as const, text })),
      ],
    };
  }

  // User accepts (positive response)
  const isPositive =
    /^(s[ií]|sip|claro|ok|okey|vale|dale|bueno|perfecto)$/i.test(lower) ||
    /\bquiero\b|\btengo\b|\bpuedo\b/.test(lower);

  if (isPositive) {
    const { message: messages } = selectVariant(
      T.CONFIRM_CLIENT_YES,
      "ASK_DNI_RETRY",
      {},
    );

    return {
      type: "update",
      nextPhase: { phase: "collecting_dni" },
      commands: messages.map((text) => ({
        type: "SEND_MESSAGE" as const,
        text,
      })),
    };
  }

  // For acknowledgment or unclear responses, re-prompt
  const { message: messages } = selectVariant(
    T.OFFER_DNI_RETRY,
    "OFFER_DNI_RETRY_REPROMPT",
    {},
  );

  return {
    type: "update",
    nextPhase: phase,
    commands: messages.map((text) => ({
      type: "SEND_MESSAGE" as const,
      text,
    })),
  };
}
