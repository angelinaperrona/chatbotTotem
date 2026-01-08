export function buildSuggestAlternativePrompt(
  requestedCategory: string,
  availableCategories: string[],
): string {
  return `Totem vende electrodomésticos en Lima/Callao. Pago: cuotas mensuales en recibo de Calidda.

"${requestedCategory}" no disponible. Opciones: ${availableCategories.join(", ")}.

Sugiere alternativa relevante (1-2 líneas), natural y amigable.

JSON: {"suggestion": "respuesta"}`;
}
