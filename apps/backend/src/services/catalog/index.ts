import { ProductService } from "./products.ts";

export { ProductService } from "./products.ts";
export { BundleService } from "./bundles.ts";

// Convenience export for conversation layer
export const getActiveCategoriesBySegment =
  ProductService.getActiveCategoriesBySegment;
