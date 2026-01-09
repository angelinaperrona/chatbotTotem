import { db } from "../../db/index.ts";
import type { LLMError } from "./types.ts";

export type LLMErrorLog = {
  id: string;
  phone_number: string;
  operation: string;
  error_type: string;
  error_message: string;
  state?: string;
  metadata?: string;
  created_at: string;
};

export function logLLMError(
  phoneNumber: string,
  operation: string,
  error: LLMError,
  state?: string,
  metadata?: Record<string, any>,
): void {
  const id = crypto.randomUUID();
  const metadataJson = metadata ? JSON.stringify(metadata) : null;

  db.prepare(
    `INSERT INTO llm_error_log (id, phone_number, operation, error_type, error_message, state, metadata)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    phoneNumber,
    operation,
    error.type,
    error.message,
    state || null,
    metadataJson,
  );
}

export function getLLMErrorStats(
  hoursBack: number = 24,
): Array<{ error_type: string; operation: string; count: number }> {
  return db
    .prepare(
      `SELECT error_type, operation, COUNT(*) as count
       FROM llm_error_log
       WHERE created_at > datetime('now', '-' || ? || ' hours')
       GROUP BY error_type, operation
       ORDER BY count DESC`,
    )
    .all(hoursBack) as Array<{
    error_type: string;
    operation: string;
    count: number;
  }>;
}

export function getRecentLLMErrors(limit: number = 50): LLMErrorLog[] {
  return db
    .prepare(
      `SELECT * FROM llm_error_log
       ORDER BY created_at DESC
       LIMIT ?`,
    )
    .all(limit) as LLMErrorLog[];
}
