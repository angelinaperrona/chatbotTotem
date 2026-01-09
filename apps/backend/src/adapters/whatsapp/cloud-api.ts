import process from "node:process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { WhatsAppAdapter } from "./types.ts";

const TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_ID = process.env.WHATSAPP_PHONE_ID;

function getPublicUrl(): string {
  const tunnelFile = resolve(import.meta.dir, "../../../../.cloudflare-url");
  if (existsSync(tunnelFile)) {
    const url = readFileSync(tunnelFile, "utf-8").trim();
    if (url) {
      console.log(`[WhatsApp] Using tunnel URL from .cloudflare-url: ${url}`);
      return url;
    }
  }
  const fallback = process.env.PUBLIC_URL || "http://localhost:3000";
  console.log(`[WhatsApp] Using fallback URL: ${fallback}`);
  return fallback;
}

const PUBLIC_URL = getPublicUrl();
const API_URL = `https://graph.facebook.com/v17.0/${PHONE_ID}/messages`;

export const CloudApiAdapter: WhatsAppAdapter = {
  async sendMessage(to: string, content: string): Promise<boolean> {
    if (!TOKEN || !PHONE_ID) {
      console.warn("[CloudAPI] Not configured, message not sent");
      return false;
    }

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { body: content },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("[CloudAPI] Error:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("[CloudAPI] Send error:", error);
      return false;
    }
  },

  async sendImage(
    to: string,
    imagePath: string,
    caption?: string,
  ): Promise<boolean> {
    if (!TOKEN || !PHONE_ID) {
      console.warn("[CloudAPI] Not configured, image not sent:", imagePath);
      return false;
    }

    const link = `${PUBLIC_URL}/static/${imagePath}`;

    try {
      const payload: Record<string, unknown> = {
        messaging_product: "whatsapp",
        to,
        type: "image",
        image: { link, ...(caption && { caption }) },
      };

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("[CloudAPI] Image error:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("[CloudAPI] Send image error:", error);
      return false;
    }
  },

  async markAsRead(messageId: string): Promise<void> {
    if (!TOKEN || !PHONE_ID) return;

    try {
      await fetch(API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          status: "read",
          message_id: messageId,
          typing_indicator: { type: "text" },
        }),
      });
    } catch {
      // Non-critical, silently fail
    }
  },
};
