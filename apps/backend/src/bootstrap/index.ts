import { setupEventSubscribers } from "./event-bus-setup.ts";
import { CheckEligibilityHandler } from "../domains/eligibility/handlers/check-eligibility-handler.ts";
import { FNBProvider } from "../domains/eligibility/providers/fnb-provider.ts";
import { initializeEnrichmentRegistry } from "../conversation/enrichment/index.ts";
import { RetryEligibilityHandler } from "../domains/recovery/handlers/retry-eligibility-handler.ts";

// Create providers
const fnbProvider = new FNBProvider();

// Create handlers
export const eligibilityHandler = new CheckEligibilityHandler(
  fnbProvider,
);

export const retryEligibilityHandler = new RetryEligibilityHandler(
  eligibilityHandler,
);

export function initializeApplication(): void {
  setupEventSubscribers();
  initializeEnrichmentRegistry(eligibilityHandler);
}
