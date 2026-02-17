import type { WhatsAppAdapter } from "./types.ts";
import { createLogger } from "../../lib/logger.ts";
import { getNotifierUrl, getPublicUrl } from "@totem/utils";
import { createAbortTimeout, TIMEOUTS } from "../../config/timeouts.ts";
import process from "node:process";

const logger = createLogger("whatsapp");

const notifierUrl = getNotifierUrl();
// Use localhost in dev, Cloudflare in production
const backendUrl = process.env.NODE_ENV === "development" 
  ? "http://localhost:3001" 
  : getPublicUrl();

export const DevAdapter: WhatsAppAdapter = {
  async sendMessage(to: string, content: string): Promise<string | null> {
    const { signal, cleanup } = createAbortTimeout(TIMEOUTS.WHATSAPP_SEND);

    try {
      const response = await fetch(`${notifierUrl}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: to, content }),
        signal,
      });

      cleanup();

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(
          { to, status: response.status, error: errorText },
          "Dev adapter send failed",
        );
        return null;
      }

      const data = (await response.json()) as {
        status: string;
        messageId?: string;
      };

      return data.messageId ?? null;
    } catch (error) {
      cleanup();

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          logger.error(
            { to, timeoutMs: TIMEOUTS.WHATSAPP_SEND },
            "Dev adapter send timeout",
          );
        } else {
          logger.error({ error, to }, "Dev adapter send error");
        }
      }

      return null;
    }
  },

  async sendImage(
    to: string,
    imagePath: string,
    caption?: string,
  ): Promise<string | null> {
    const { signal, cleanup } = createAbortTimeout(TIMEOUTS.WHATSAPP_IMAGE);

    try {
      const response = await fetch(`${notifierUrl}/send-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: to, imagePath, caption }),
        signal,
      });

      cleanup();

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(
          { to, imagePath, error: errorText },
          "Dev adapter image send failed",
        );
        return null;
      }

      const data = (await response.json()) as {
        status: string;
        messageId?: string;
      };

      return data.messageId ?? null;
    } catch (error) {
      cleanup();

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          logger.error(
            { to, imagePath, timeoutMs: TIMEOUTS.WHATSAPP_IMAGE },
            "Dev adapter image send timeout",
          );
        } else {
          logger.error(
            { error, to, imagePath },
            "Dev adapter image send error",
          );
        }
      }

      return null;
    }
  },

  async markAsRead(_messageId: string): Promise<void> {
    // whatsapp-web.js handles read receipts automatically
  },
};
