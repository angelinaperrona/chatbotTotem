import type { Database } from "bun:sqlite";
import { db } from "./connection.ts";
import { initializeDatabase } from "./init.ts";
import { seedUsers } from "./seeds/users.ts";
import { seedPeriods } from "./seeds/periods.ts";
import { seedProducts } from "./seeds/products.ts";
import { seedBundles } from "./seeds/bundles.ts";
import { seedTestData } from "./seeds/test-data.ts";

export async function seedDatabase(database: Database) {
  await seedUsers(database);
  await seedPeriods(database);
  await seedProducts(database);
  await seedBundles(database);

  if (process.env.NODE_ENV !== "production") {
    await seedTestData(database);
  }
}

if (import.meta.main) {
  initializeDatabase(db);
  await seedDatabase(db);
  process.exit(0);
}
