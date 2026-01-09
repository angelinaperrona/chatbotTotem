import type { ProviderCheckResult } from "@totem/types";
import { PowerBIClient } from "../../adapters/providers/powerbi-client.ts";
import { isAvailable, markBlocked } from "../../adapters/providers/health.ts";
import { PersonasService } from "../../domains/personas/index.ts";
import { isProviderForcedDown } from "../settings/system.ts";
import { getSimulationPersona } from "./shared.ts";

function parseCreditString(saldoStr: string | undefined): number {
  if (!saldoStr || typeof saldoStr !== "string" || saldoStr === "undefined") {
    return 0;
  }
  const clean = saldoStr
    .replace("S/", "")
    .trim()
    .replace(/\./g, "")
    .replace(",", ".");
  return parseFloat(clean) || 0;
}

export async function checkGASO(
  dni: string,
  phoneNumber?: string,
): Promise<ProviderCheckResult> {
  if (phoneNumber) {
    const persona = await getSimulationPersona(phoneNumber);
    if (persona) {
      console.log(`[GASO] Using test persona: ${persona.name}`);
      return PersonasService.toProviderResult(persona);
    }
  }

  if (isProviderForcedDown("gaso")) {
    console.log(`[GASO] Provider forced down by admin for DNI ${dni}`);
    return { eligible: false, credit: 0, reason: "provider_forced_down" };
  }

  if (!isAvailable("powerbi")) {
    console.log(`[GASO] PowerBI unavailable, using fallback for DNI ${dni}`);
    return { eligible: false, credit: 0, reason: "provider_unavailable" };
  }

  try {
    const { estado, nombre, saldoStr, nseStr } =
      await PowerBIClient.queryAll(dni);

    if (!estado && !nombre && !saldoStr && !nseStr) {
      console.log(`[GASO] PowerBI returned no data for DNI ${dni}`);
      return { eligible: false, credit: 0, reason: "provider_unavailable" };
    }

    if (!estado || estado === "--" || estado === "NO APLICA") {
      const credit = parseCreditString(saldoStr);
      return {
        eligible: false,
        credit,
        reason: credit === 0 ? "no_credit_line" : "not_eligible_per_calidda",
        name: nombre,
      };
    }

    const credit = parseCreditString(saldoStr);
    const nse =
      nseStr && nseStr !== "undefined" ? parseInt(nseStr, 10) : undefined;

    return { eligible: true, credit, name: nombre, nse };
  } catch (error) {
    console.error("[GASO] Error:", error);

    if (error instanceof Error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("auth") || msg.includes("401") || msg.includes("403")) {
        markBlocked("powerbi", error.message);
      }
    }

    return { eligible: false, credit: 0, reason: "api_error" };
  }
}
