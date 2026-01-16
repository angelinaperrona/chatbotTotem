import type { Database } from "bun:sqlite";
import { BASE_PRODUCTS } from "../seed-data/products.ts";

export async function seedProducts(db: Database) {
  const exists = db.prepare("SELECT count(*) as count FROM products").get() as {
    count: number;
  };

  if (exists.count > 0) {
    return;
  }

  const stmt = db.prepare(
    `INSERT INTO products (id, name, category, brand, model, specs_json)
     VALUES (?, ?, ?, ?, ?, ?)`,
  );

  for (const product of BASE_PRODUCTS) {
    stmt.run(
      product.id,
      product.name,
      product.category,
      product.brand,
      product.model,
      JSON.stringify(product.specs),
    );
  }
}
