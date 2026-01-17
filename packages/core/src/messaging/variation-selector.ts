export type VariantKey = string; // e.g., "GREETING", "COLLECT_DNI"

export interface VariantContext {
  usedVariantKeys?: Record<VariantKey, number>; // Key: variant index used
  [key: string]: unknown;
}

/**
 * Bot response model:
 * - Single response = string (single text message)
 * - ResponseSequence = string[] (messages sent in sequence with 150ms delay)
 * - ResponseVariants = string[][] (array of variant sequences)
 */
export type ResponseSequence = string[];
export type ResponseVariants = ResponseSequence[];

/**
 * Select a variant from response variants, avoiding previously used ones
 *
 * @param variants - Response variants (array of response sequences)
 * @param key - Unique key for this message type (e.g., "GREETING")
 * @param context - Conversation context containing used variant tracking
 * @returns Selected response sequence and updated context
 */
export function selectVariant(
  variants: ResponseVariants,
  key: VariantKey,
  context: VariantContext,
): { message: ResponseSequence; updatedContext: Partial<VariantContext> } {
  if (!variants || variants.length === 0) {
    throw new Error(`No variants provided for key: ${key}`);
  }

  // Single variant
  if (variants.length === 1) {
    return {
      message: variants[0] ?? [],
      updatedContext: {},
    };
  }

  const usedVariantKeys = context.usedVariantKeys || {};
  const previousIndex = usedVariantKeys[key];

  // Get available indices (not previously used)
  const availableIndices = variants
    .map((_, index) => index)
    .filter((index) => index !== previousIndex);

  // If all variants used, reset for this key
  const indices =
    availableIndices.length > 0
      ? availableIndices
      : variants.map((_, index) => index);

  // Random selection from available
  const selectedIndex =
    indices[Math.floor(Math.random() * indices.length)] ?? 0;

  return {
    message: variants[selectedIndex] ?? [],
    updatedContext: {
      usedVariantKeys: {
        ...usedVariantKeys,
        [key]: selectedIndex,
      } as Record<string, number>,
    },
  };
}

export interface ContextSignals {
  frustrated?: boolean; // User showing frustration
  needsPatience?: boolean; // User needs more time
  repeatRequest?: boolean; // Asking same thing again
  tone?: "formal" | "casual" | "neutral";
}

export interface CategorizedVariants {
  standard: ResponseVariants;
  empathetic?: ResponseVariants;
  patient?: ResponseVariants;
  casual?: ResponseVariants;
  formal?: ResponseVariants;
}

export function selectVariantWithContext(
  variants: CategorizedVariants,
  key: VariantKey,
  context: VariantContext,
  signals: ContextSignals = {},
): { message: ResponseSequence; updatedContext: Partial<VariantContext> } {
  // Select appropriate category based on signals
  let selectedCategory = variants.standard;

  if (signals.frustrated && variants.empathetic) {
    selectedCategory = variants.empathetic;
    key = `${key}_empathetic`;
  } else if (signals.needsPatience && variants.patient) {
    selectedCategory = variants.patient;
    key = `${key}_patient`;
  } else if (signals.tone === "casual" && variants.casual) {
    selectedCategory = variants.casual;
    key = `${key}_casual`;
  } else if (signals.tone === "formal" && variants.formal) {
    selectedCategory = variants.formal;
    key = `${key}_formal`;
  }

  return selectVariant(selectedCategory, key, context);
}
