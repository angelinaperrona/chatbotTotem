import { db } from "../../db/index.ts";
import { getOne, getAll } from "../../db/query.ts";
import type { CatalogPeriod, PeriodStatus } from "@totem/types";

type CreatePeriodData = {
  name: string;
  year_month: string;
  created_by: string;
};

export const PeriodService = {
  getAll: (): CatalogPeriod[] => {
    return getAll<CatalogPeriod>(
      "SELECT * FROM catalog_periods ORDER BY year_month DESC",
    );
  },

  getById: (id: string): CatalogPeriod | null => {
    return (
      getOne<CatalogPeriod>("SELECT * FROM catalog_periods WHERE id = ?", [
        id,
      ]) || null
    );
  },

  getActive: (): CatalogPeriod | null => {
    return (
      getOne<CatalogPeriod>(
        "SELECT * FROM catalog_periods WHERE status = 'active' LIMIT 1",
      ) || null
    );
  },

  getByYearMonth: (yearMonth: string): CatalogPeriod | null => {
    return (
      getOne<CatalogPeriod>(
        "SELECT * FROM catalog_periods WHERE year_month = ?",
        [yearMonth],
      ) || null
    );
  },

  create: (data: CreatePeriodData): CatalogPeriod => {
    const id = `period-${data.year_month}`;

    db.prepare(
      `INSERT INTO catalog_periods (id, name, year_month, status, created_by)
       VALUES (?, ?, ?, 'draft', ?)`,
    ).run(id, data.name, data.year_month, data.created_by);

    return PeriodService.getById(id)!;
  },

  updateStatus: (id: string, status: PeriodStatus): CatalogPeriod => {
    const now = Date.now();

    if (status === "active") {
      // Deactivate any currently active period
      db.prepare(
        "UPDATE catalog_periods SET status = 'archived' WHERE status = 'active'",
      ).run();

      // Set this one active with published timestamp
      db.prepare(
        "UPDATE catalog_periods SET status = 'active', published_at = ? WHERE id = ?",
      ).run(now, id);
    } else {
      db.prepare("UPDATE catalog_periods SET status = ? WHERE id = ?").run(
        status,
        id,
      );
    }

    return PeriodService.getById(id)!;
  },

  delete: (id: string): { success: boolean; message?: string } => {
    // Only allow deleting draft periods with no products
    const period = PeriodService.getById(id);
    if (!period) {
      return { success: false, message: "Período no encontrado" };
    }

    if (period.status !== "draft") {
      return {
        success: false,
        message: "Solo se pueden eliminar períodos en borrador",
      };
    }

    // Check for bundles
    const bundleCount = getOne<{ count: number }>(
      "SELECT COUNT(*) as count FROM catalog_bundles WHERE period_id = ?",
      [id],
    )!;

    if (bundleCount.count > 0) {
      return {
        success: false,
        message: "No se puede eliminar un período con productos",
      };
    }

    db.prepare("DELETE FROM catalog_periods WHERE id = ?").run(id);
    return { success: true };
  },
};
