import type { Database } from "bun:sqlite";
import { getActivePeriodId } from "./periods.ts";
import { BUNDLES_SEED } from "../seed-data/bundles.ts";
import { FNB_BUNDLES_SEED } from "../seed-data/fnb-bundles.ts";

const BUNDLE_NOTES =
  "01 año de garantía, delivery gratuito, cero cuota inicial";

export async function seedBundles(db: Database) {
  const periodId = getActivePeriodId();

  const exists = db
    .prepare(
      "SELECT count(*) as count FROM catalog_bundles WHERE period_id = ?",
    )
    .get(periodId) as { count: number };

  if (exists.count > 0) {
    return;
  }

  const stmt = db.prepare(
    `INSERT INTO catalog_bundles (
      id, period_id, segment, name, price, primary_category,
      categories_json, image_id, composition_json, installments_json, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  for (const bundle of BUNDLES_SEED) {
    stmt.run(
      `bundle-${bundle.image_id}`,
      periodId,
      "gaso",
      bundle.name,
      bundle.price,
      bundle.primary_category,
      JSON.stringify(bundle.categories),
      bundle.image_id,
      JSON.stringify(bundle.composition),
      JSON.stringify(bundle.installments),
      BUNDLE_NOTES,
    );
  }

  for (const bundle of FNB_BUNDLES_SEED) {
    stmt.run(
      `fnb-${bundle.image_id}`,
      periodId,
      "fnb",
      bundle.name,
      bundle.price,
      bundle.primary_category,
      JSON.stringify(bundle.categories),
      bundle.image_id,
      JSON.stringify(bundle.composition),
      JSON.stringify(bundle.installments),
      BUNDLE_NOTES,
    );
  }
}
