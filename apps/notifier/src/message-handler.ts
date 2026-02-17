import type { Client, Message } from "whatsapp-web.js";
import process from "node:process";
import { forwardToBackend } from "./message-forwarder.ts";
import { saveGroupMapping } from "./group-registry.ts";
import { isGroupJid, isBroadcastJid } from "./lib/whatsapp-formatters.ts";
import { createLogger } from "./logger.ts";

const logger = createLogger("messages");
const IS_DEV = process.env.NODE_ENV === "development";

let messageCount = 0;

export function setupMessageHandler(client: Client) {
  logger.info("Setting up message handler...");
  
  client.on("message", async (msg) => {
    messageCount++;
    try {
      await handleMessage(msg);
    } catch (error) {
      logger.error({ error, from: msg.from }, "Message handling failed");
    }
  });
  
  logger.info("Message handler registered");
  logger.info(`Message handler ready. Total messages: ${messageCount}`);
}

async function handleMessage(msg: Message) {
  const isGroupMessage = isGroupJid(msg.from);
  const isCommand = msg.body?.startsWith("@") || false;

  logger.info(`📬 Raw message received [#${messageCount}]`);
  logger.info(`   from: ${msg.from}`);
  logger.info(`   body: ${msg.body?.substring(0, 50)}`);
  logger.info(`   type: ${msg.type}`);
  logger.info(`   fromMe: ${msg.fromMe}`);

  // Ignore system messages and broadcasts
  if (isBroadcastJid(msg.from)) {
    logger.debug("Ignoring broadcast message");
    return;
  }

  // Ignore empty messages (except for group commands)
  const hasContent = msg.body && msg.body.trim().length > 0;
  if (!hasContent && !isGroupMessage) {
    logger.debug("Ignoring empty non-group message");
    return;
  }

  // Debug: log all incoming messages
  logger.debug(
    {
      from: msg.from,
      preview: msg.body?.substring(0, 50),
      isGroup: isGroupMessage,
      isCommand,
      fromMe: msg.fromMe,
      isDev: IS_DEV,
    },
    "Message conditions",
  );

  if (IS_DEV && !isGroupMessage && !isCommand && msg.fromMe === false) {
    logger.info(`✅ Forwarding message to backend - from: ${msg.from}`);
    await forwardToBackend(msg);
    return;
  }

  logger.debug(`Message not forwarded - isDev:${IS_DEV}, isGroup:${isGroupMessage}, isCommand:${isCommand}, fromMe:${msg.fromMe}`);

  if (msg.body === "@activate" && isGroupMessage) {
    await handleActivateCommand(msg);
  }
}

async function handleActivateCommand(msg: Message) {
  const chat = await msg.getChat();
  const groupName = chat.name || "unknown";

  saveGroupMapping(groupName, msg.from);

  await msg.reply(
    `Grupo "${groupName}" activado para notificaciones.\nJID: ${msg.from}`,
  );

  logger.info({ groupName, jid: msg.from }, "Group registered");
}
