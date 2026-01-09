import { Hono } from "hono";
import { PeriodService } from "../domains/catalog/periods.ts";
import { logAction } from "../platform/audit/logger.ts";
import { requireRole } from "../middleware/auth.ts";

const periods = new Hono();

const requireCatalogWrite = requireRole("admin", "developer", "supervisor");

// List all periods
periods.get("/", (c) => {
  return c.json(PeriodService.getAll());
});

// Get active period
periods.get("/active", (c) => {
  const period = PeriodService.getActive();
  if (!period) {
    return c.json({ error: "No hay período activo" }, 404);
  }
  return c.json(period);
});

// Get period by ID
periods.get("/:id", (c) => {
  const id = c.req.param("id");
  const period = PeriodService.getById(id);
  if (!period) {
    return c.json({ error: "Período no encontrado" }, 404);
  }
  return c.json(period);
});

// Create new period
periods.post("/", requireCatalogWrite, async (c) => {
  const user = c.get("user");
  const { name, year_month } = await c.req.json();

  if (!name || !year_month) {
    return c.json({ error: "name y year_month son requeridos" }, 400);
  }

  // Validate year_month format (YYYY-MM)
  if (!/^\d{4}-\d{2}$/.test(year_month)) {
    return c.json({ error: "year_month debe tener formato YYYY-MM" }, 400);
  }

  // Check if period already exists
  const existing = PeriodService.getByYearMonth(year_month);
  if (existing) {
    return c.json({ error: "Ya existe un período para ese mes" }, 400);
  }

  const period = PeriodService.create({
    name,
    year_month,
    created_by: user.id,
  });

  logAction(user.id, "create_period", "period", period.id, {
    name,
    year_month,
  });

  return c.json(period, 201);
});

// Update period status (publish/archive)
periods.patch("/:id/status", requireCatalogWrite, async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");
  const { status } = await c.req.json();

  if (!["draft", "active", "archived"].includes(status)) {
    return c.json({ error: "Estado inválido" }, 400);
  }

  const period = PeriodService.getById(id);
  if (!period) {
    return c.json({ error: "Período no encontrado" }, 404);
  }

  // Cannot revert archived to draft
  if (period.status === "archived" && status === "draft") {
    return c.json(
      { error: "No se puede revertir un período archivado a borrador" },
      400,
    );
  }

  const updated = PeriodService.updateStatus(id, status);

  logAction(user.id, "update_period_status", "period", id, {
    old_status: period.status,
    new_status: status,
  });

  return c.json(updated);
});

// Delete period (only draft, no products)
periods.delete("/:id", requireCatalogWrite, (c) => {
  const id = c.req.param("id");
  const user = c.get("user");

  const result = PeriodService.delete(id);

  if (!result.success) {
    return c.json({ error: result.message }, 400);
  }

  logAction(user.id, "delete_period", "period", id);
  return c.json({ success: true });
});

export default periods;
