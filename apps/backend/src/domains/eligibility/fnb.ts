import type { ProviderCheckResult } from "@totem/types";
import { FNBClient } from "../../adapters/providers/fnb-client.ts";
import { isAvailable, markBlocked } from "../../adapters/providers/health.ts";
import { PersonasService } from "../../domains/personas/index.ts";
import { isProviderForcedDown } from "../settings/system.ts";
import { getSimulationPersona } from "./shared.ts";

export async function checkFNB(
  dni: string,
  phoneNumber?: string,
): Promise<ProviderCheckResult> {
  if (phoneNumber) {
    const persona = await getSimulationPersona(phoneNumber);
    if (persona) {
      console.log(`[FNB] Using test persona: ${persona.name}`);
      return PersonasService.toProviderResult(persona);
    }
  }

  if (isProviderForcedDown("fnb")) {
    console.log(`[FNB] Provider forced down by admin for DNI ${dni}`);
    return { eligible: false, credit: 0, reason: "provider_forced_down" };
  }

  if (!isAvailable("fnb")) {
    console.log(`[FNB] Provider unavailable for DNI ${dni}`);
    return { eligible: false, credit: 0, reason: "provider_unavailable" };
  }

  try {
    console.log(`[FNB] Checking credit for DNI ${dni}...`);
    const data = await FNBClient.queryCreditLine(dni);

    if (!(data.valid && data.data)) {
      console.log(`[FNB] No data found for DNI ${dni}`);
      return { eligible: false, credit: 0, name: undefined };
    }

    const credit = parseFloat(data.data.lineaCredito || "0");
    console.log(
      `[FNB] Found credit for DNI ${dni}: S/ ${credit}, Name: ${data.data.nombre}`,
    );

    return { eligible: true, credit, name: data.data.nombre };
  } catch (error) {
    console.error(`[FNB] Error checking credit for DNI ${dni}:`, error);

    if (error instanceof Error) {
      const msg = error.message.toLowerCase();
      if (
        msg.includes("auth") ||
        msg.includes("401") ||
        msg.includes("403") ||
        msg.includes("bloqueado")
      ) {
        markBlocked("fnb", error.message);
      }
    }

    return { eligible: false, credit: 0, reason: "api_error" };
  }
}
