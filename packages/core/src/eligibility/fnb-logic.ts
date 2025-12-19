const MIN_CREDIT_THRESHOLD = 100;

export function checkFNBEligibility(credit: number): boolean {
    return credit >= MIN_CREDIT_THRESHOLD;
}

export function getFNBCreditTier(
    credit: number,
): "low" | "medium" | "high" | "premium" {
    if (credit < 1000) return "low";
    if (credit < 3000) return "medium";
    if (credit < 5000) return "high";
    return "premium";
}
