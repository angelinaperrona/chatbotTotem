import { db } from "../../db/index.ts";
import { getOne, getAll } from "../../db/query.ts";
import type { SQLQueryBindings } from "bun:sqlite";
import type { Bundle } from "@totem/types";
import { imageStorage } from "../../adapters/storage/images.ts";

type BundleFilters = {
  periodId?: string;
  maxPrice?: number;
  category?: string;
  strictPriceLimit?: boolean;
  offset?: number;
  query?: string;
  segment?: "gaso" | "fnb";
};

export const BundleService = {
  /** Get all bundles for a period (dashboard) */
  getByPeriod: (periodId: string, segment?: "gaso" | "fnb"): Bundle[] => {
    if (segment) {
      const rows = getAll<Bundle>(
        "SELECT * FROM catalog_bundles WHERE period_id = ? AND segment = ? ORDER BY primary_category, price",
        [periodId, segment],
      );
      return rows;
    }

    const rows = getAll<Bundle>(
      "SELECT * FROM catalog_bundles WHERE period_id = ? ORDER BY primary_category, price",
      [periodId],
    );
    return rows;
  },

  /** Get available bundles for bot (active period, filters) */
  getAvailable: (filters: BundleFilters = {}): Bundle[] => {
    let query = `
      SELECT b.* FROM catalog_bundles b
      JOIN catalog_periods p ON b.period_id = p.id
      WHERE p.status = 'active'
        AND b.is_active = 1
        AND b.stock_status != 'out_of_stock'
    `;
    const params: SQLQueryBindings[] = [];

    if (filters.segment) {
      query += " AND b.segment = ?";
      params.push(filters.segment);
    }

    if (filters.strictPriceLimit && filters.maxPrice !== undefined) {
      query += " AND b.price <= ?";
      params.push(filters.maxPrice);
    }

    if (filters.category) {
      // Match primary_category OR any category in categories_json
      query += " AND (b.primary_category = ? OR b.categories_json LIKE ?)";
      params.push(filters.category, `%"${filters.category}"%`);
    }

    if (filters.query) {
      query += " AND b.name LIKE ?";
      params.push(`%${filters.query}%`);
    }

    query += " ORDER BY b.price ASC";
    query += " LIMIT 3";

    if (filters.offset) {
      query += " OFFSET ?";
      params.push(filters.offset);
    }

    const rows = getAll<Bundle>(query, params);
    return rows;
  },

  getById: (id: string): Bundle | null => {
    const row = getOne<Bundle>("SELECT * FROM catalog_bundles WHERE id = ?", [
      id,
    ]);
    return row || null;
  },

  create: (data: {
    id: string;
    period_id: string;
    segment: "gaso" | "fnb";
    name: string;
    price: number;
    primary_category: string;
    categories_json: string;
    image_id: string;
    composition_json: string;
    installments_json: string;
    notes?: string;
    created_by: string | null;
  }): Bundle => {
    db.prepare(`
      INSERT INTO catalog_bundles (id, period_id, segment, name, price, primary_category, categories_json, image_id, composition_json, installments_json, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.id,
      data.period_id,
      data.segment,
      data.name,
      data.price,
      data.primary_category,
      data.categories_json,
      data.image_id,
      data.composition_json,
      data.installments_json,
      data.notes || "01 año de garantía, delivery gratuito, cero cuota inicial",
      data.created_by,
    );
    return BundleService.getById(data.id)!;
  },

  update: (
    id: string,
    updates: Partial<
      Pick<Bundle, "name" | "price" | "is_active" | "stock_status" | "notes">
    >,
  ): Bundle => {
    const entries = Object.entries(updates).filter(([, v]) => v !== undefined);
    if (entries.length === 0) return BundleService.getById(id)!;

    const fields = entries.map(([k]) => `${k} = ?`).join(", ");
    const values = entries.map(([, v]) => v);

    db.prepare(
      `UPDATE catalog_bundles SET ${fields}, updated_at = unixepoch('now', 'subsec') * 1000 WHERE id = ?`,
    ).run(...values, id);
    return BundleService.getById(id)!;
  },

  bulkUpdate: (
    ids: string[],
    updates: Partial<Pick<Bundle, "is_active" | "stock_status">>,
  ): number => {
    const entries = Object.entries(updates).filter(([, v]) => v !== undefined);
    if (entries.length === 0 || ids.length === 0) return 0;

    const fields = entries.map(([k]) => `${k} = ?`).join(", ");
    const values = entries.map(([, v]) => v);
    const placeholders = ids.map(() => "?").join(",");

    const result = db
      .prepare(
        `UPDATE catalog_bundles SET ${fields}, updated_at = unixepoch('now', 'subsec') * 1000 WHERE id IN (${placeholders})`,
      )
      .run(...values, ...ids);
    return result.changes;
  },

  updateImage: async (id: string, newImageId: string): Promise<Bundle> => {
    const existing = BundleService.getById(id);
    if (!existing) throw new Error("Bundle not found");

    await imageStorage.delete(existing.image_id);
    db.prepare(
      `UPDATE catalog_bundles SET image_id = ?, updated_at = unixepoch('now', 'subsec') * 1000 WHERE id = ?`,
    ).run(newImageId, id);
    return BundleService.getById(id)!;
  },

  delete: async (id: string): Promise<void> => {
    const bundle = BundleService.getById(id);
    if (bundle) {
      await imageStorage.delete(bundle.image_id);
    }
    db.prepare("DELETE FROM catalog_bundles WHERE id = ?").run(id);
  },

  getAvailableCategories: (segment?: "gaso" | "fnb"): string[] => {
    if (segment) {
      const rows = getAll<{ category: string }>(
        `SELECT DISTINCT b.primary_category as category FROM catalog_bundles b
         JOIN catalog_periods p ON b.period_id = p.id
         WHERE p.status = 'active' AND b.is_active = 1 AND b.stock_status != 'out_of_stock'
           AND b.segment = ?
         ORDER BY b.primary_category`,
        [segment],
      );
      return rows.map((r) => r.category);
    }

    const rows = getAll<{ category: string }>(
      `SELECT DISTINCT b.primary_category as category FROM catalog_bundles b
       JOIN catalog_periods p ON b.period_id = p.id
       WHERE p.status = 'active' AND b.is_active = 1 AND b.stock_status != 'out_of_stock'
       ORDER BY b.primary_category`,
    );
    return rows.map((r) => r.category);
  },

  getAffordableCategories: (
    segment: "gaso" | "fnb",
    creditLine: number,
  ): string[] => {
    const rows = getAll<{ category: string }>(
      `SELECT DISTINCT b.primary_category as category FROM catalog_bundles b
       JOIN catalog_periods p ON b.period_id = p.id
       WHERE p.status = 'active' AND b.is_active = 1 AND b.stock_status != 'out_of_stock'
         AND b.segment = ?
         ${segment === "gaso" ? "AND b.price <= ?" : ""}
       ORDER BY b.primary_category`,
      segment === "gaso" ? [segment, creditLine] : [segment],
    );
    return rows.map((r) => r.category);
  },

  /**
   * Get ALL categories that exist in the bundles table (taxonomy),
   * regardless of whether they are currently active or in stock.
   * Used for "We don't have that right now" vs "We never have that" distinction.
   */
  getAllCategories: (): string[] => {
    const rows = getAll<{ category: string }>(
      "SELECT DISTINCT primary_category as category FROM catalog_bundles ORDER BY primary_category",
    );
    return rows.map((r) => r.category);
  },

  /**
   * Check if a specific product exists in the active catalog for a category.
   */
  hasProduct: (category: string, productQuery: string): boolean => {
    const row = getOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM catalog_bundles b
       JOIN catalog_periods p ON b.period_id = p.id
       WHERE p.status = 'active'
         AND b.is_active = 1
         AND b.stock_status != 'out_of_stock'
         AND b.primary_category = ?
         AND b.name LIKE ?`,
      [category, `%${productQuery}%`],
    );
    return (row?.count || 0) > 0;
  },
};
