import { MessagingService } from "./messaging-service.ts";
import { client } from "./whatsapp-client.ts";
import { isGroupJid } from "./lib/whatsapp-formatters.ts";

let messagingService: MessagingService | null = null;

export function getMessagingService(): MessagingService {
  if (!messagingService && client) {
    messagingService = new MessagingService(client);
  }
  if (!messagingService) {
    throw new Error("Messaging service not initialized");
  }
  return messagingService;
}

export async function sendDirectMessage(
  phoneNumber: string,
  content: string,
): Promise<string> {
  return getMessagingService().sendMessage(phoneNumber, content);
}

export async function sendDirectImage(
  phoneNumber: string,
  imagePath: string,
  caption?: string,
): Promise<string> {
  return getMessagingService().sendImage(phoneNumber, imagePath, caption);
}

/**
 * Send message to any JID (individual, group, or cloud JID)
 * Detects if it's a group and routes to the appropriate method
 */
export async function sendMessage(
  jid: string,
  content: string,
): Promise<string> {
  const service = getMessagingService();
  
  if (isGroupJid(jid)) {
    return service.sendToGroup(jid, content);
  }
  
  return service.sendToCloudJid(jid, content);
}
