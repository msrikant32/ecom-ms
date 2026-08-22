const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api/v1";

async function extractErrorMessage(res: Response): Promise<string | undefined> {
  try {
    const body = await res.json();
    return body?.error?.message;
  } catch {
    return undefined;
  }
}

export interface SqlSchemaTable {
  table: string;
  columns: string[];
}

export interface SqlQueryResult {
  rows: Record<string, unknown>[];
  rowCount: number;
  truncated: boolean;
}

export async function fetchSqlSchema(): Promise<SqlSchemaTable[]> {
  const res = await fetch(`${API_BASE}/sql-playground/schema`);
  if (!res.ok) throw new Error((await extractErrorMessage(res)) ?? `Failed to load schema (${res.status})`);
  const body = await res.json();
  return body.tables;
}

export async function runSqlQuery(sql: string): Promise<SqlQueryResult> {
  const res = await fetch(`${API_BASE}/sql-playground/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sql }),
  });
  if (!res.ok) {
    throw new Error((await extractErrorMessage(res)) ?? `Query failed (${res.status})`);
  }
  return res.json();
}

export interface MongoSchema {
  [collection: string]: { exampleDocument: Record<string, unknown> };
}

export interface MongoQueryResult {
  documents: Record<string, unknown>[];
  count: number;
}

export async function fetchMongoSchema(): Promise<MongoSchema> {
  const res = await fetch(`${API_BASE}/mongo-playground/schema`);
  if (!res.ok) throw new Error((await extractErrorMessage(res)) ?? `Failed to load schema (${res.status})`);
  return res.json();
}

export async function runMongoQuery(params: {
  collection: string;
  filter: unknown;
  sort?: unknown;
  limit?: number;
}): Promise<MongoQueryResult> {
  const res = await fetch(`${API_BASE}/mongo-playground/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    throw new Error((await extractErrorMessage(res)) ?? `Query failed (${res.status})`);
  }
  return res.json();
}
