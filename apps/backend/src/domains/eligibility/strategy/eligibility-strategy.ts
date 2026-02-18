import type { Result } from "../../../shared/result/index.ts";
import { Ok, Err, isErr } from "../../../shared/result/index.ts";
import type { ProviderCheckResult } from "@totem/types";
import type { ProviderResults, EligibilityEvaluation } from "./types.ts";
import { SystemOutageError } from "./types.ts";
import type { ProviderError } from "../providers/provider.ts";

function isProviderError<T>(
  result: Result<T, ProviderError>,
): result is { ok: false; error: ProviderError } {
  return isErr(result);
}

export function evaluateResults(
  results: ProviderResults,
): Result<EligibilityEvaluation, SystemOutageError> {
  const fnbFailed = isTechnicalFailure(results.fnb);

  // FNB provider is required
  if (fnbFailed) {
    const fnbError = isProviderError(results.fnb)
      ? results.fnb.error
      : new Error("FNB failed with unknown error");

    return Err(
      new SystemOutageError(
        fnbError as ProviderError,
      ),
    );
  }

  // FNB available
  if (results.fnb.ok) {
    return Ok({
      result: results.fnb.value,
      source: "fnb" as const,
    });
  }

  // Not eligible
  return Ok({
    result: { eligible: false, credit: 0, reason: "not_qualified" },
    source: "fnb" as const,
  });
}

function isTechnicalFailure(result: Result<ProviderCheckResult, any>): boolean {
  if (isErr(result)) return true;

  const reason = result.value.reason;
  return (
    reason === "api_error" ||
    reason === "provider_unavailable" ||
    reason === "provider_forced_down"
  );
}
