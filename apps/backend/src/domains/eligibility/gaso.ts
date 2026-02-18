import type { ProviderCheckResult } from "@totem/types";
import { isProviderForcedDown } from "../settings/system.ts";
import { getSimulationPersona } from "./shared.ts";
import { PersonasService } from "../../domains/personas/index.ts";
import { createLogger } from "../../lib/logger.ts";

const logger = createLogger("eligibility");

export async function checkGASO(
  dni: string,
  phoneNumber?: string,
): Promise<ProviderCheckResult> {
  if (phoneNumber) {
    const persona = await getSimulationPersona(phoneNumber);
    if (persona) {
      return PersonasService.toProviderResult(persona);
    }
  }

  if (isProviderForcedDown("gaso")) {
    logger.debug({ dni }, "GASO provider not available");
    return { eligible: false, credit: 0, reason: "provider_unavailable" };
  }

  // GASO provider (PowerBI) has been removed
  // Using simulation or direct assignment if available
  logger.debug({ dni }, "GASO provider not available - PowerBI removed");
  return { eligible: false, credit: 0, reason: "provider_unavailable" };
}
