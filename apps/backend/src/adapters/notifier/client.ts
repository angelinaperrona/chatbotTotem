import { createLogger } from "../../lib/logger.ts";
import { getNotifierUrl } from "@totem/utils";

const logger = createLogger("notifier");

const notifierUrl = getNotifierUrl();

type NotifyRequest = {
  channel: "agent" | "dev" | "sales";
  message: string;
};

export async function notifyTeam(
  channel: "agent" | "dev" | "sales",
  message: string,
): Promise<boolean> {
  try {
    const response = await fetch(`${notifierUrl}/notify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel, message } as NotifyRequest),
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
