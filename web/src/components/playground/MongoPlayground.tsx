"use client";

import { useEffect, useState } from "react";
import { fetchMongoSchema, runMongoQuery, type MongoSchema, type MongoQueryResult } from "@/lib/playground/api";
import { ResultsTable } from "./ResultsTable";

const EXAMPLES = [
  { label: "All products", collection: "products", filter: "{}" },
  { label: "Products under $100", collection: "products", filter: '{ "price": { "$lt": 100 } }' },
  {
    label: "Orders for a customer (embedded, no join)",
    collection: "orders",
    filter: '{ "customer.name": "Ava Chen" }',
  },
  { label: "Orders containing a product", collection: "orders", filter: '{ "items.productName": "Webcam 4K" }' },
  { label: "Try $where (blocked)", collection: "products", filter: '{ "$where": "this.price > 0" }' },
];

export function MongoPlayground() {
  const [schema, setSchema] = useState<MongoSchema | null>(null);
  const [collection, setCollection] = useState("products");
  const [filterText, setFilterText] = useState(EXAMPLES[0].filter);
  const [result, setResult] = useState<MongoQueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMongoSchema()
      .then(setSchema)
      .catch(() => setSchema(null));
  }, []);

  async function handleRun() {
    setLoading(true);
    setError(null);
    let filter: unknown;
    try {
      filter = JSON.parse(filterText);
    } catch {
      setLoading(false);
      setError("Filter must be valid JSON");
      return;
    }
    try {
      const res = await runMongoQuery({ collection, filter, limit: 20 });
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
      {schema && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(schema).map(([name, def]) => (
            <span
              key={name}
              className="rounded-md border border-zinc-200 px-2.5 py-1 font-mono text-[11px] text-zinc-600 dark:border-zinc-800 dark:text-zinc-400"
              title={JSON.stringify(def.exampleDocument)}
            >
              {name}
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {EXAMPLES.map((ex) => (
          <button
            key={ex.label}
            onClick={() => {
              setCollection(ex.collection);
              setFilterText(ex.filter);
            }}
            className="rounded-full border border-zinc-300 px-3 py-1 text-xs text-zinc-600 transition-colors hover:border-emerald-400 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-emerald-600"
          >
            {ex.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          value={collection}
          onChange={(e) => setCollection(e.target.value)}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        >
          <option value="products">products</option>
          <option value="orders">orders</option>
        </select>
        <textarea
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          rows={3}
          spellCheck={false}
          className="w-full flex-1 rounded-lg border border-zinc-300 bg-white p-3 font-mono text-xs text-zinc-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleRun}
          disabled={loading}
          className="rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
        >
          {loading ? "Running…" : "Run find()"}
        </button>
        <span className="text-xs text-zinc-500 dark:text-zinc-500">
          Read-only find() against separate, isolated demo collections.
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
            {result.count} document{result.count === 1 ? "" : "s"}
          </p>
          <ResultsTable rows={result.documents} />
        </div>
      )}
    </div>
  );
}
