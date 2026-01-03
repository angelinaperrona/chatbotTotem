import type { Database } from "bun:sqlite";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

export function initializeDatabase(db: Database) {
  const schemaPath = path.join(process.cwd(), "src", "db", "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf-8");
  db.run(schema);
}
