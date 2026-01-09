type ProviderName = "fnb" | "gaso" | "powerbi";

type HealthStatus = {
  status: "healthy" | "blocked";
  lastError: string | null;
  blockedUntil: Date | null;
};

const BLOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutes

const providers: Map<ProviderName, HealthStatus> = new Map([
  ["fnb", { status: "healthy", lastError: null, blockedUntil: null }],
  ["gaso", { status: "healthy", lastError: null, blockedUntil: null }],
  ["powerbi", { status: "healthy", lastError: null, blockedUntil: null }],
]);

export function isAvailable(provider: ProviderName): boolean {
  const health = providers.get(provider)!;
  if (health.status === "healthy") return true;
  if (health.blockedUntil && new Date() > health.blockedUntil) {
    markHealthy(provider);
    return true;
  }
  return false;
}

export function markBlocked(provider: ProviderName, errorMsg: string): void {
  const health = providers.get(provider)!;
  const wasHealthy = health.status === "healthy";

  health.status = "blocked";
  health.lastError = errorMsg;
  health.blockedUntil = new Date(Date.now() + BLOCK_DURATION_MS);

  if (wasHealthy) {
    console.error(
      `[${provider.toUpperCase()}] BLOCKED for 30min - ${errorMsg}`,
    );
  }
}

export function markHealthy(provider: ProviderName): void {
  const health = providers.get(provider)!;
  health.status = "healthy";
  health.lastError = null;
  health.blockedUntil = null;
}

export function getStatus(provider: ProviderName) {
  const health = providers.get(provider)!;
  return {
    status: health.status,
    available: isAvailable(provider),
    lastError: health.lastError,
    blockedUntil: health.blockedUntil?.toISOString() || null,
  };
}

export function getAllStatus() {
  return {
    fnb: getStatus("fnb"),
    gaso: getStatus("gaso"),
    powerbi: getStatus("powerbi"),
  };
}
