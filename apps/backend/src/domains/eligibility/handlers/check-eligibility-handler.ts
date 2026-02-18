import type { Result } from "../../../shared/result/index.ts";
import { isErr } from "../../../shared/result/index.ts";
import { asyncEmitter } from "../../../bootstrap/event-bus-setup.ts";
import { FNBProvider } from "../providers/fnb-provider.ts";
import { evaluateResults } from "../strategy/eligibility-strategy.ts";
import { createEvent } from "../../../shared/events/index.ts";
import type { EnrichmentResult } from "@totem/core";
import { mapEligibilityToEnrichment } from "../mapper.ts";
import { createLogger } from "../../../lib/logger.ts";

const logger = createLogger("check-eligibility");

export class CheckEligibilityHandler {
  constructor(
    private fnbProvider: FNBProvider,
  ) {}

  async execute(
    dni: string,
    phoneNumber?: string,
  ): Promise<Result<EnrichmentResult>> {
    // 1. Check FNB provider
    const fnbResult = await this.fnbProvider.checkEligibility(dni, phoneNumber);

    // 2. Evaluate results
    const evaluation = evaluateResults({
      fnb: fnbResult,
    });

    // 3. Handle evaluation result
    if (isErr(evaluation)) {
      // If FNB provider fails, emit event
      await asyncEmitter.emitCritical(
        createEvent("system_outage_detected", {
          dni,
          errors: [
            evaluation.error.fnbError.message,
          ],
          timestamp: Date.now(),
        }),
      );

      logger.error(
        {
          dni,
          error: evaluation.error.fnbError,
        },
        "FNB provider failed",
      );

      return {
        ok: true,
        value: {
          type: "eligibility_result",
          status: "system_outage",
          handoffReason: "fnb_provider_down",
        },
      };
    }

    // 4. Success - no warnings needed with single provider
    // 5. Log success
    if (evaluation.value.result.eligible) {
      logger.info(
        {
          dni,
          phoneNumber,
          source: evaluation.value.source,
          credit: evaluation.value.result.credit,
          name: evaluation.value.result.name,
        },
        "Customer eligible",
      );
    }

    // 6. Map to enrichment result
    const enrichmentResult = mapEligibilityToEnrichment({
      ...evaluation.value.result,
      needsHuman: false,
    });

    return { ok: true, value: enrichmentResult };
  }
}
