import type { CategoryMetadata } from "../helpers/category-metadata.ts";

export function buildExtractCategoryPrompt(
  categoryMetadata: CategoryMetadata[],
): string {
  const categoryList = categoryMetadata
    .map((cat) => {
      const parts = [`**${cat.key}**`];
      if (cat.aliases.length > 0) {
        parts.push(`aliases: ${cat.aliases.join(", ")}`);
      }
      if (cat.brands.length > 0) {
        parts.push(`brands: ${cat.brands.join(", ")}`);
      }
      return `- ${parts.join(" | ")}`;
    })
    .join("\n");

  return `Extrae la categoría de producto mencionada.

CATEGORÍAS DISPONIBLES:
${categoryList}

Devuelve la categoría exacta (key) o null si no hay coincidencia.

JSON: {"category": "key" | null}`;
}
