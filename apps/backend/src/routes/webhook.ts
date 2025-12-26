import { Hono } from "hono";
import process from "node:process";
import { debounceMessage } from "../agent/debouncer.ts";
import { processMessage } from "../agent/engine.ts";
import { WhatsAppService } from "../services/whatsapp.ts";
import { IMAGE_REJECTED, NON_TEXT_REJECTED } from "@totem/core";

const webhook = new Hono();

// webhook verification (GET)
webhook.get("/", (c) => {
    const mode = c.req.query("hub.mode");
    const token = c.req.query("hub.verify_token");
    const challenge = c.req.query("hub.challenge");

    console.log("[WEBHOOK GET] Verification request:", { mode, token: token?.slice(0, 10) + "...", challenge });

    if (
        mode === "subscribe" &&
        token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN
    ) {
        console.log("[WEBHOOK GET] ✅ Verification successful");
        return c.text(challenge || "");
    }

    console.log("[WEBHOOK GET] ❌ Verification failed");
    return c.text("Forbidden", 403);
});

// webhook message handler (POST)
webhook.post("/", async (c) => {
    try {
        const body = await c.req.json();
        console.log("[WEBHOOK POST] Received payload:", JSON.stringify(body, null, 2));
        
        const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

        if (!message) {
            console.log("[WEBHOOK POST] ⚠️  No message in payload");
            return c.json({ status: "no_message" });
        }

        const phoneNumber = message.from;
        console.log("[WEBHOOK POST] Message details:", { 
            from: phoneNumber, 
            type: message.type, 
            id: message.id 
        });

        if (message.type !== "text") {
            console.log(`[WEBHOOK POST] ⚠️  Non-text message type: ${message.type}`);
            if (message.type === "image" || message.type === "document") {
                await WhatsAppService.sendMessage(phoneNumber, IMAGE_REJECTED);
            }
            // Generic rejection for audio/video/stickers/etc
            else {
                await WhatsAppService.sendMessage(
                    phoneNumber,
                    NON_TEXT_REJECTED,
                );
            }

            return c.json({ status: "non_text_rejected", type: message.type });
        }

        const text = message.text.body;
        console.log(`[WEBHOOK POST] 📨 Text message: "${text}"`);

        // Log inbound message
        WhatsAppService.logMessage(
            phoneNumber,
            "inbound",
            "text",
            text,
            "received",
        );

        console.log(`[WEBHOOK POST] ⏳ Queueing message for processing...`);
        
        // Debounce and process
        debounceMessage(phoneNumber, text, async (phone, aggregatedText) => {
            console.log(`[DEBOUNCER] 🚀 Processing aggregated message for ${phone}: "${aggregatedText}"`);
            await processMessage(phone, aggregatedText);
        });

        console.log(`[WEBHOOK POST] ✅ Message queued successfully`);
        return c.json({ status: "queued" });
    } catch (error) {
        console.error("[WEBHOOK POST] ❌ Error:", error);
        console.error("[WEBHOOK POST] Stack:", error instanceof Error ? error.stack : "No stack");
        return c.json({ status: "error" }, 500);
    }
});

export default webhook;
