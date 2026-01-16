import type { Database } from "bun:sqlite";

const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function getCurrentPeriod() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const yearMonth = `${year}-${String(month + 1).padStart(2, "0")}`;
  const name = `${MONTH_NAMES[month]} ${year}`;
  const id = `period-${yearMonth}`;

  return { id, name, yearMonth };
}

export async function seedPeriods(db: Database) {
  const exists = db
    .prepare("SELECT count(*) as count FROM catalog_periods")
    .get() as { count: number };

  if (exists.count > 0) {
    return;
  }

  const period = getCurrentPeriod();

  db.prepare(
    `INSERT INTO catalog_periods (id, name, year_month, status, created_by)
     VALUES (?, ?, ?, 'active', NULL)`,
  ).run(period.id, period.name, period.yearMonth);
}

export function getActivePeriodId(): string {
  return getCurrentPeriod().id;
}
