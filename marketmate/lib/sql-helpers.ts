import type { Database, SqlValue } from "sql.js";

type BindParams = Record<string, SqlValue> | SqlValue[];

/** Runs a SELECT and maps rows to plain objects keyed by column name. */
export function queryAll<T>(
  db: Database,
  sql: string,
  params: BindParams = [],
): T[] {
  const stmt = db.prepare(sql);
  try {
    stmt.bind(params);
    const rows: T[] = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject() as T);
    }
    return rows;
  } finally {
    stmt.free();
  }
}

/** Runs a SELECT and returns the first row, or null if no rows matched. */
export function queryOne<T>(
  db: Database,
  sql: string,
  params: BindParams = [],
): T | null {
  const rows = queryAll<T>(db, sql, params);
  return rows[0] ?? null;
}

/** Runs an INSERT/UPDATE/DELETE with bound parameters. */
export function execute(
  db: Database,
  sql: string,
  params: BindParams = [],
): void {
  const stmt = db.prepare(sql);
  try {
    stmt.bind(params);
    stmt.step();
  } finally {
    stmt.free();
  }
}
