const FINANCIAL_HALLUCINATION_PATTERNS = [
    /garant[ií]a de aprobaci[óo]n/i,
    /sin inter[ée]s/i,
    /tasa 0%/i,
    /cr[ée]dito ilimitado/i,
    /sin verificaci[óo]n/i,
    /aprobaci[óo]n inmediata/i,
    /100% seguro/i,
];

const SUSPICIOUS_DISCOUNT_PATTERNS = [
    /descuento del \d{2,3}%/i,
    /gratis/i,
    /regalo/i,
    /promoci[óo]n exclusiva/i,
];

export function containsFinancialHallucination(text: string): boolean {
    return FINANCIAL_HALLUCINATION_PATTERNS.some((pattern) =>
        pattern.test(text),
    );
}

export function containsSuspiciousDiscount(text: string): boolean {
    return SUSPICIOUS_DISCOUNT_PATTERNS.some((pattern) => pattern.test(text));
}

export function sanitizeLLMOutput(text: string): string {
    if (containsFinancialHallucination(text)) {
        return "Disculpa, hubo un error en mi respuesta. Déjame reformular...";
    }
    return text;
}
