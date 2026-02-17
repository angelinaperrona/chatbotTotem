import type { Client } from "whatsapp-web.js";
import { MessageMedia } from "whatsapp-web.js";
import path from "node:path";
import {
  formatPhoneToJid,
  formatPhoneToCloudJid,
} from "./lib/whatsapp-formatters.ts";

export class MessagingService {
  constructor(private client: Client) {}

  async sendMessage(phoneNumber: string, content: string): Promise<string> {
    if (!this.client) {
      throw new Error("WhatsApp client not initialized");
    }

    const jid = formatPhoneToJid(phoneNumber);
    const message = await this.client.sendMessage(jid, content);
    return message.id._serialized;
  }

  async sendImage(
    phoneNumber: string,
    imagePath: string,
    caption?: string,
  ): Promise<string> {
    if (!this.client) {
      throw new Error("WhatsApp client not initialized");
    }

    const jid = formatPhoneToJid(phoneNumber);
    // Resolve path from notifier working directory to backend data
    const resolvedPath = path.resolve(process.cwd(), "../backend/data/uploads", imagePath);
    const media = await MessageMedia.fromFilePath(resolvedPath);
    const message = await this.client.sendMessage(jid, media, { caption });
    return message.id._serialized;
  }

  async sendToGroup(groupJid: string, content: string): Promise<string> {
    if (!this.client) {
      throw new Error("WhatsApp client not initialized");
    }

    const message = await this.client.sendMessage(groupJid, content);
    return message.id._serialized;
  }

  async sendToCloudJid(phoneNumber: string, content: string): Promise<string> {
    if (!this.client) {
      throw new Error("WhatsApp client not initialized");
    }

    const jid = formatPhoneToCloudJid(phoneNumber);
    const message = await this.client.sendMessage(jid, content);
    return message.id._serialized;
  }
}
