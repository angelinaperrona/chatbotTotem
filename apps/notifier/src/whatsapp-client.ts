import { Client, LocalAuth } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import process from "node:process";
import fs from "node:fs";
import { setupMessageHandler } from "./message-handler.ts";
import { createLogger } from "./logger.ts";

const logger = createLogger("whatsapp");
const DATA_PATH = process.env.NOTIFIER_DATA_PATH || "./data";

export let client: Client | null = null;
let isReady = false;

export async function initializeWhatsAppClient() {
  fs.mkdirSync(DATA_PATH, { recursive: true });

  logger.info("Creating WhatsApp client...");

  client = new Client({
    authStrategy: new LocalAuth({
      dataPath: DATA_PATH,
    }),
    puppeteer: {
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-web-resources",
      ],
      headless: true,
      executablePath: process.env.CHROME_PATH || undefined,
    },
  });

  setupClientEventHandlers(client);
  setupMessageHandler(client);

  logger.info("Initializing WhatsApp client...");

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new Error("Timeout after 120 seconds")),
      120000,
    ),
  );

  try {
    // Just start initialization and let it run
    logger.debug("Calling client.initialize()...");
    await Promise.race([client.initialize(), timeoutPromise]);
    logger.info("WhatsApp client initialized successfully");
    
    // Start state polling
    startReadyStatePoller(client);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error({ error: errorMsg }, "WhatsApp client initialization failed");
    
    if (client) {
      try {
        await client.destroy();
      } catch {
        // Ignore
      }
      client = null;
    }
    throw error;
  }
}

function startReadyStatePoller(client: Client) {
  let pollCount = 0;
  const pollInterval = setInterval(() => {
    pollCount++;
    try {
      const info = client.info;
      if (info && !isReady) {
        isReady = true;
        logger.info({ info }, "✅ WhatsApp client is READY (detected via polling)");
        clearInterval(pollInterval);
      }
    } catch (e) {
      if (pollCount % 10 === 0) {
        logger.debug("Still polling for ready state...");
      }
    }
    
    // Stop polling after 60 seconds
    if (pollCount > 120) {
      clearInterval(pollInterval);
      if (!isReady) {
        logger.warn("Ready state polling timeout");
      }
    }
  }, 500);
}

function setupClientEventHandlers(client: Client) {
  client.on("qr", (qr) => {
    logger.info("QR code ready. Scan to authenticate");
    qrcode.generate(qr, { small: true });
  });

  client.on("ready", () => {
    isReady = true;
    logger.info("✅ WhatsApp client READY event fired - Listening for messages");
  });

  client.on("authenticated", () => {
    logger.info("Authenticated event fired");
    // Force ready after auth
    setTimeout(() => {
      if (!isReady) {
        try {
          const info = client.info;
          if (info) {
            isReady = true;
            logger.info({ info }, "✅ Client authenticated and ready (forcing ready state)");
          }
        } catch (e) {
          logger.error({ error: e }, "Failed to check client info after auth");
        }
      }
    }, 1000);
  });

  client.on("auth_failure", (msg) => {
    logger.error({ reason: msg }, "❌ WhatsApp authentication failed");
  });

  client.on("disconnected", (reason) => {
    isReady = false;
    logger.warn({ reason }, "⚠️  WhatsApp client disconnected");
  });

  client.on("error", (error) => {
    logger.error(
      { error: error instanceof Error ? error.message : String(error) },
      "❌ WhatsApp client error",
    );
  });

  // Add state_changed event if available
  client.on("change_state", (state) => {
    logger.debug({ state }, "Client state changed");
  });
}
