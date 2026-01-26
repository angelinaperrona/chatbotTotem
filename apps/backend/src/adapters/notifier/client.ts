import { createLogger } from "../../lib/logger.ts";
import { getNotifierUrl } from "@totem/utils";

const logger = createLogger("notifier");

const notifierUrl = getNotifierUrl();

type NotifyRequest = {
  channel: "agent" | "dev" | "sales" | "direct";
  message: string;
  phoneNumber?: string;
};

export async function notifyTeam(
  channel: "agent" | "dev" | "sales" | "direct",
  message: string,
  options?: { phoneNumber?: string },
): Promise<boolean> {
  try {
    const payload: NotifyRequest = { channel, message };
    if (options?.phoneNumber) {
      payload.phoneNumber = options.phoneNumber;
    }

    const response = await fetch(`${notifierUrl}/notify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    return response.ok;
  } catch (error) {
    logger.error({ error, channel }, "Notifier service error");
    return false;
  }
}

export async function checkNotifierHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${notifierUrl}/health`, {
      method: "GET",
    });
    return response.ok;
  } catch {
    return false;
  }
}
