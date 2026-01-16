import type {
  ConversationMetadata,
  TransitionResult,
  EnrichmentResult,
} from "../types.ts";
import { selectVariant } from "../../messaging/variation-selector.ts";
import { extractDNI } from "../../validation/regex.ts";
import { isAffirmative, isNegative } from "../../validation/affirmation.ts";
import * as T from "../../templates/standard.ts";

export function transitionConfirmingClient(
  message: string,
  metadata: ConversationMetadata,
  enrichment?: EnrichmentResult,
): TransitionResult {
  if (enrichment?.type === "recovery_response") {
    return {
      type: "update",
      nextPhase: { phase: "confirming_client" },
      commands: [{ type: "SEND_MESSAGE", text: enrichment.text }],
    };
  }

  // Check if user volunteered DNI early (implicit confirmation)
  const earlyDNI = extractDNI(message);
  if (earlyDNI) {
    return {
      type: "need_enrichment",
      enrichment: { type: "check_eligibility", dni: earlyDNI },
      pendingPhase: { phase: "checking_eligibility", dni: earlyDNI },
    };
  }

  // NEGATIVE patterns
  if (isNegative(message)) {
    const { message } = selectVariant(
      T.CONFIRM_CLIENT_NO,
      "CONFIRM_CLIENT_NO",
      {},
    );

    return {
      type: "update",
      nextPhase: { phase: "closing", purchaseConfirmed: false },
      commands: [
        {
          type: "TRACK_EVENT",
          event: "not_calidda_client",
          metadata: { response: message.join(" ") },
        },
        ...message.map((text) => ({ type: "SEND_MESSAGE" as const, text })),
      ],
    };
  }

  // POSITIVE patterns
  if (isAffirmative(message)) {
    // If we have previous session data
    if (metadata.dni && metadata.segment && metadata.credit !== undefined) {
      if (metadata.segment === "fnb") {
        return {
          type: "update",
          nextPhase: {
            phase: "offering_products",
            segment: "fnb",
            credit: metadata.credit,
            name: metadata.name || "",
          },
          commands: [
            {
              type: "SEND_MESSAGE",
              text: metadata.name
                ? `¡Excelente ${metadata.name}! Sigamos viendo opciones para ti.`
                : `¡Excelente! Sigamos viendo opciones para ti.`,
            },
          ],
        };
      }

      // GASO needs age confirmation
      return {
        type: "update",
        nextPhase: {
          phase: "collecting_age",
          dni: metadata.dni,
          name: metadata.name || "",
        },
        commands: [
          {
            type: "SEND_MESSAGE",
            text: metadata.name
              ? `¡Excelente ${metadata.name}! Sigamos viendo opciones para ti.`
              : `¡Excelente! Sigamos viendo opciones para ti.`,
          },
        ],
      };
    }

    // Normal flow, ask for DNI
    const { message } = selectVariant(
      T.CONFIRM_CLIENT_YES,
      "CONFIRM_CLIENT_YES",
      {},
    );

    return {
      type: "update",
      nextPhase: { phase: "collecting_dni" },
      commands: [
        {
          type: "TRACK_EVENT",
          event: "confirmed_calidda_client",
          metadata: { response: message.join(" ") },
        },
        ...message.map((text) => ({ type: "SEND_MESSAGE" as const, text })),
      ],
    };
  }

  return {
    type: "need_enrichment",
    enrichment: {
      type: "recover_unclear_response",
      message,
      context: {
        phase: "confirming_client",
        lastQuestion: "¿Eres titular del servicio de gas natural de Calidda?",
        expectedOptions: ["Sí", "No"],
      },
    },
    pendingPhase: { phase: "confirming_client" },
  };
}
