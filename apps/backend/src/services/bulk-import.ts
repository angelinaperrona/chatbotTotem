import {
  BundleService,
  FnbOfferingService,
  ProductService,
} from "./catalog/index.ts";
import { PeriodService } from "./periods.ts";
import { db } from "../db/index.ts";

/**
 * CSV Format for Bundles (GASO):
 * period_id,name,price,primary_category,image_id,composition_json,installments_json
 *
 * CSV Format for FNB Offerings:
 * period_id,product_id,price,category,image_id,installments
 *
 * Notes:
 * - period_id: Must reference an existing draft period
 * - image_id: Required, must be a valid image ID in storage
 * - composition_json: JSON string with fixed + choices arrays (for bundles)
 * - installments_json: JSON string with payment schedule (for bundles)
 */
export const BulkImportService = {
  processBundlesCsv: async (csvContent: string, userId: string) => {
    const lines = csvContent
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) {
      return {
        successCount: 0,
        errors: ["CSV vacío o solo contiene encabezado"],
      };
    }

    const dataRows = lines.slice(1);
    let successCount = 0;
    const errors: string[] = [];

    const transaction = db.transaction(() => {
      for (let idx = 0; idx < dataRows.length; idx++) {
        const line = dataRows[idx];
        if (!line) continue;

        const cols = line.split(",").map((c) => c.trim());

        if (cols.length < 6) {
          errors.push(`Fila ${idx + 2}: Se requieren al menos 6 columnas`);
          continue;
        }

        const [
          periodId,
          name,
          price,
          primaryCategory,
          imageId,
          compositionJson,
          installmentsJson,
        ] = cols;

        if (
          !periodId ||
          !name ||
          !price ||
          !primaryCategory ||
          !imageId ||
          !compositionJson ||
          !installmentsJson
        ) {
          errors.push(`Fila ${idx + 2}: Faltan campos requeridos`);
          continue;
        }

        const period = PeriodService.getById(periodId);
        if (!period) {
          errors.push(`Fila ${idx + 2}: Período "${periodId}" no existe`);
          continue;
        }
        if (period.status !== "draft") {
          errors.push(`Fila ${idx + 2}: El período debe estar en borrador`);
          continue;
        }

        const parsedPrice = Number.parseFloat(price);
        if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
          errors.push(`Fila ${idx + 2}: Precio inválido "${price}"`);
          continue;
        }

        try {
          const id = `bundle-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          BundleService.create({
            id,
            period_id: periodId,
            name,
            price: parsedPrice,
            primary_category: primaryCategory,
            categories_json: "[]",
            image_id: imageId,
            composition_json: compositionJson,
            installments_json: installmentsJson,
            created_by: userId,
          });
          successCount++;
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          errors.push(`Fila ${idx + 2}: ${msg}`);
        }
      }
    });

    transaction();
    return { successCount, errors };
  },

  processFnbCsv: async (csvContent: string, userId: string) => {
    const lines = csvContent
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) {
      return {
        successCount: 0,
        errors: ["CSV vacío o solo contiene encabezado"],
      };
    }

    const dataRows = lines.slice(1);
    let successCount = 0;
    const errors: string[] = [];

    const transaction = db.transaction(() => {
      for (let idx = 0; idx < dataRows.length; idx++) {
        const line = dataRows[idx];
        if (!line) continue;

        const cols = line.split(",").map((c) => c.trim());

        if (cols.length < 5) {
          errors.push(`Fila ${idx + 2}: Se requieren al menos 5 columnas`);
          continue;
        }

        const [periodId, productId, price, category, imageId, installments] =
          cols;

        if (!periodId || !productId || !price || !category || !imageId) {
          errors.push(`Fila ${idx + 2}: Faltan campos requeridos`);
          continue;
        }

        const period = PeriodService.getById(periodId);
        if (!period) {
          errors.push(`Fila ${idx + 2}: Período "${periodId}" no existe`);
          continue;
        }
        if (period.status !== "draft") {
          errors.push(`Fila ${idx + 2}: El período debe estar en borrador`);
          continue;
        }

        const product = ProductService.getById(productId);
        if (!product) {
          errors.push(`Fila ${idx + 2}: Producto "${productId}" no existe`);
          continue;
        }

        const parsedPrice = Number.parseFloat(price);
        if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
          errors.push(`Fila ${idx + 2}: Precio inválido "${price}"`);
          continue;
        }

        const parsedInstallments = installments
          ? Number.parseInt(installments, 10)
          : undefined;

        try {
          const id = `fnb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          FnbOfferingService.create({
            id,
            period_id: periodId,
            product_id: productId,
            product_snapshot_json: JSON.stringify(product),
            price: parsedPrice,
            category,
            installments: parsedInstallments,
            image_id: imageId,
            created_by: userId,
          });
          successCount++;
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          errors.push(`Fila ${idx + 2}: ${msg}`);
        }
      }
    });

    transaction();
    return { successCount, errors };
  },

  // Legacy method for backward compatibility
  processCsv: async (csvContent: string, userId: string) => {
    // Detect format by header
    const firstLine = csvContent.split("\n")[0] || "";
    if (firstLine.includes("composition_json")) {
      return BulkImportService.processBundlesCsv(csvContent, userId);
    }
    return BulkImportService.processFnbCsv(csvContent, userId);
  },
};
