import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import { CheckEligibilityHandler } from "../src/domains/eligibility/handlers/check-eligibility-handler.ts";
import { RetryEligibilityHandler } from "../src/domains/recovery/handlers/retry-eligibility-handler.ts";
import { FNBProvider } from "../src/domains/eligibility/providers/fnb-provider.ts";
import { initializeEnrichmentRegistry } from "../src/conversation/enrichment/index.ts";
import { enrichmentRegistry } from "../src/conversation/enrichment/registry.ts";
import { db } from "../src/db/index.ts";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import jwt from "jsonwebtoken";

const FAKE_TOKEN = jwt.sign({ commercialAllyId: "123" }, "secret");

describe("Provider outage recovery", () => {
  const testPhone = "51999999999";
  const testDNI = "12345678";
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    process.env.CALIDDA_BASE_URL = "https://test.calidda.com";
    process.env.CALIDDA_USERNAME = "testuser";
    process.env.CALIDDA_PASSWORD = "testpass";

    const schemaPath = join(import.meta.dir, "../src/db/schema.sql");
    const schema = readFileSync(schemaPath, "utf-8");

    const statements = schema
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    for (const statement of statements) {
      db.run(statement);
    }

    db.prepare("DELETE FROM conversations WHERE phone_number = ?").run(
      testPhone,
    );
    db.prepare("DELETE FROM users WHERE id = 'test-agent'").run();

    // Initialize enrichment registry
    const fnbProvider = new FNBProvider();
    const eligibilityHandler = new CheckEligibilityHandler(
      fnbProvider,
    );
    enrichmentRegistry.clear();
    initializeEnrichmentRegistry(eligibilityHandler);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("should detect system_outage when APIs return 5xx errors", async () => {
    globalThis.fetch = mock(async (input: any) => {
      const url = input.toString();

      if (url.includes("autenticar")) {
        return new Response(
          JSON.stringify({
            valid: true,
            data: { authToken: FAKE_TOKEN },
          }),
        );
      }
      if (url.includes("lineaCredito"))
        return new Response("Service Unavailable", { status: 503 });

      return new Response("Not Found", { status: 404 });
    }) as any;

    const fnbProvider = new FNBProvider();
    const eligibilityHandler = new CheckEligibilityHandler(
      fnbProvider,
    );
    const result = await eligibilityHandler.execute(testDNI, testPhone);

    if (result.ok && result.value.type === "eligibility_result") {
      expect(result.value.status).toBe("system_outage");
      expect(result.value.handoffReason).toBe("fnb_provider_down");
    } else {
      throw new Error("Expected eligibility_result in response");
    }
  });

  it("should recovery stuck conversations when APIs recover", async () => {
    const phase = {
      phase: "waiting_for_recovery",
      dni: testDNI,
      timestamp: Date.now(),
    };
    const metadata = { createdAt: Date.now(), lastActivityAt: Date.now() };
    db.prepare(
      `INSERT INTO conversations (phone_number, context_data, status) 
        VALUES (?, ?, 'active')`,
    ).run(testPhone, JSON.stringify({ phase, metadata }));

    globalThis.fetch = mock(async (input: any) => {
      const url = input.toString();

      if (url.includes("autenticar")) {
        return new Response(
          JSON.stringify({
            valid: true,
            data: { authToken: FAKE_TOKEN },
          }),
        );
      }
      if (url.includes("lineaCredito")) {
        return new Response(
          JSON.stringify({
            valid: true,
            data: { lineaCredito: "1500.00", nombre: "Juana Test" },
          }),
        );
      }

      return new Response("Not Found", { status: 404 });
    }) as any;

    const fnbProvider = new FNBProvider();
    const eligibilityHandler = new CheckEligibilityHandler(
      fnbProvider,
    );
    const handler = new RetryEligibilityHandler(eligibilityHandler);
    const result = await handler.execute();

    if (result.ok) {
      expect(result.value.recoveredCount).toBe(1);
    } else {
      throw new Error("Expected success result");
    }
  });
});
