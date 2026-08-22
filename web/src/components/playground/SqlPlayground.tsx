"use client";

import { useEffect, useState } from "react";
import { fetchSqlSchema, runSqlQuery, type SqlSchemaTable, type SqlQueryResult } from "@/lib/playground/api";
import { ResultsTable } from "./ResultsTable";

const EXAMPLES = [
  {
    label: "Simple SELECT",
    sql: "SELECT * FROM products WHERE stock < 20;",
  },
  {
    label: "JOIN across 4 tables",
    sql: `SELECT c.name AS customer, p.name AS product, oi.quantity, oi.unit_price
FROM customers c
JOIN orders o ON o.customer_id = c.id
JOIN order_items oi ON oi.order_id = o.id
JOIN products p ON p.id = oi.product_id
WHERE c.name = 'Ava Chen';`,
  },
  {
    label: "Aggregate: revenue per customer",
    sql: `SELECT c.name, SUM(oi.quantity * oi.unit_price) AS total_spent
FROM customers c
JOIN orders o ON o.customer_id = c.id
JOIN order_items oi ON oi.order_id = o.id
GROUP BY c.id
ORDER BY total_spent DESC;`,
  },
  {
    label: "Try a write (blocked)",
    sql: "DELETE FROM products WHERE id = 1;",
  },
];

export function SqlPlayground() {
  const [schema, setSchema] = useState<SqlSchemaTable[] | null>(null);
  const [sql, setSql] = useState(EXAMPLES[0].sql);
  const [result, setResult] = useState<SqlQueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSqlSchema()
      .then(setSchema)
      .catch(() => setSchema([]));
  }, []);

  async function handleRun() {
    setLoading(true);
    setError(null);
    try {
      const res = await runSqlQuery(sql);
      setResult(res);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "Query failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {schema && schema.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {schema.map((t) => (
            <span
              key={t.table}
              className="rounded-md border border-zinc-200 px-2.5 py-1 font-mono text-[11px] text-zinc-600 dark:border-zinc-800 dark:text-zinc-400"
              title={t.columns.join(", ")}
            >
              {t.table}({t.columns.join(", ")})
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {EXAMPLES.map((ex) => (
          <button
            key={ex.label}
            onClick={() => setSql(ex.sql)}
            className="rounded-full border border-zinc-300 px-3 py-1 text-xs text-zinc-600 transition-colors hover:border-sky-400 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-sky-600"
          >
            {ex.label}
          </button>
        ))}
      </div>

      <textarea
        value={sql}
        onChange={(e) => setSql(e.target.value)}
        rows={6}
        spellCheck={false}
        className="w-full rounded-lg border border-zinc-300 bg-white p-3 font-mono text-xs text-zinc-900 focus:border-sky-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      />

      <div className="flex items-center gap-3">
        <button
          onClick={handleRun}
          disabled={loading}
          className="rounded-full bg-sky-600 px-4 py-1.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
        >
          {loading ? "Running…" : "Run query"}
        </button>
        <span className="text-xs text-zinc-500 dark:text-zinc-500">
          Only SELECT runs — this hits a real, read-only SQLite connection.
        </span>
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 font-mono text-xs text-red-700 dark:text-red-400">
          {error}
        </p>
      )}

      {result && (
        <div className="flex flex-col gap-2">
          <p className="font-mono text-xs text-zinc-500 dark:text-zinc-500">
            {result.rowCount} row{result.rowCount === 1 ? "" : "s"}
            {result.truncated && " (truncated at 100)"}
          </p>
          <ResultsTable rows={result.rows} />
        </div>
      )}
    </div>
  );
}
