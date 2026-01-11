import type {
  ConversationPhase,
  ConversationMetadata,
  TransitionResult,
  Command,
} from "@totem/core";
import { WhatsAppService } from "../../adapters/whatsapp/index.ts";
import { notifyTeam } from "../../adapters/notifier/client.ts";
import { sendBundleImages } from "../images.ts";
import { trackEvent } from "../../domains/analytics/index.ts";
import { getOrCreateConversation, updateConversation } from "../store.ts";
import { sleep } from "./sleep.ts";

/**
 * Execute commands returned by the state machine.
 *
 * Implements the command pattern: state machine returns pure data commands,
 * this module executes them with side effects.
 */
export async function executeCommands(
  result: TransitionResult,
  phoneNumber: string,
  metadata: ConversationMetadata,
  isSimulation: boolean,
): Promise<void> {
  if (result.type === "need_enrichment") {
    // Should not reach here, enrichment loop should handle it
    console.error(
      "[CommandExecutor] Unexpected need_enrichment in executeCommands",
    );
    await notifyTeam(
      "dev",
      `CRITICAL: need_enrichment leaked to executeCommands for ${phoneNumber}`,
    );
    return;
  }

  const currentConversation = getOrCreateConversation(phoneNumber);
  if (
    JSON.stringify(currentConversation.phase) !==
    JSON.stringify(result.nextPhase)
  ) {
    updateConversation(phoneNumber, result.nextPhase, metadata);
  }

  for (let i = 0; i < result.commands.length; i++) {
    const command = result.commands[i];
    if (!command) continue;

    // Add 1 second delay between SEND_MESSAGE commands for natural pacing
    if (i > 0 && command.type === "SEND_MESSAGE") {
      const prevCommand = result.commands[i - 1];
      if (prevCommand?.type === "SEND_MESSAGE") {
        await sleep(1000);
      }
    }

    await executeCommand(
      command,
      phoneNumber,
      result.nextPhase,
      metadata,
      isSimulation,
    );
  }
}

async function executeCommand(
  command: Command,
  phoneNumber: string,
  phase: ConversationPhase,
  metadata: ConversationMetadata,
  isSimulation: boolean,
): Promise<void> {
  switch (command.type) {
    case "SEND_MESSAGE":
      await sendMessage(phoneNumber, command.text, isSimulation);
      break;

    case "SEND_IMAGES":
      await executeImages(command, phoneNumber, phase, isSimulation);
      break;

    case "TRACK_EVENT":
      trackEvent(phoneNumber, command.event, {
        segment: metadata.segment,
        ...command.metadata,
      });
      break;

    case "NOTIFY_TEAM":
      await notifyTeam(command.channel, command.message);
      break;

    case "ESCALATE":
      // Phase update already handled in executeCommands
      console.log(`[CommandExecutor] Escalation: ${command.reason}`);
      break;
  }
}

async function sendMessage(
  phoneNumber: string,
  content: string,
  isSimulation: boolean,
): Promise<void> {
  if (isSimulation) {
    WhatsAppService.logMessage(
      phoneNumber,
      "outbound",
      "text",
      content,
      "sent",
    );
  } else {
    await WhatsAppService.sendMessage(phoneNumber, content);
  }
}

async function executeImages(
  command: Extract<Command, { type: "SEND_IMAGES" }>,
  phoneNumber: string,
  phase: ConversationPhase,
  isSimulation: boolean,
): Promise<void> {
  if (
    phase.phase !== "offering_products" &&
    phase.phase !== "handling_objection"
  ) {
    console.warn("[CommandExecutor] Images requested outside offering phase");
    return;
  }

  const credit = "credit" in phase ? phase.credit : 0;
  const segment = "segment" in phase ? phase.segment : "fnb";

  const result = await sendBundleImages({
    phoneNumber,
    segment,
    category: command.category,
    creditLine: credit,
    isSimulation,
  });

  // Update phase with sent products for validation in next message
  if (result.success && result.products.length > 0) {
    const updatedPhase: ConversationPhase = {
      ...phase,
      sentProducts: result.products,
    };
    const conversation = getOrCreateConversation(phoneNumber);
    updateConversation(phoneNumber, updatedPhase, conversation.metadata);
  }
}
