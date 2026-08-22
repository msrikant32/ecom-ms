"use client";

import { useMemo, useState } from "react";
import { CodeBlock } from "@/components/interview/CodeBlock";
import {
  reactQuickRef,
  reactQuickRefCategories,
  type ReactDifficulty,
} from "@/content/interview/reactQuickRef";

const DIFFICULTIES: ReactDifficulty[] = ["Basic", "Intermediate", "Advanced"];

const DIFFICULTY_STYLE: Record<ReactDifficulty, { badge: string; pillActive: string }> = {
  Basic: {
    badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    pillActive: "bg-emerald-600 text-white border-emerald-600",
  },
  Intermediate: {
    badge: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    pillActive: "bg-amber-600 text-white border-amber-600",
  },
  Advanced: {
    badge: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
    pillActive: "bg-rose-600 text-white border-rose-600",
  },
};

function cardKey(category: string, question: string) {
  return `${category}::${question}`;
}

export function QuickRefDeck() {
  const [query, setQuery] = useState("");
  const [activeDiffs, setActiveDiffs] = useState<Set<ReactDifficulty>>(new Set());
  const [openKeys, setOpenKeys] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reactQuickRef.filter((item) => {
      const diffOk = activeDiffs.size === 0 || activeDiffs.has(item.difficulty);
      const queryOk =
        !q ||
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);
      return diffOk && queryOk;
    });
  }, [query, activeDiffs]);

  function toggleDiff(d: ReactDifficulty) {
    setActiveDiffs((prev) => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d);
      else next.add(d);
      return next;
    });
  }

  function toggleCard(key: string) {
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function expandAll() {
    setOpenKeys(new Set(filtered.map((q) => cardKey(q.category, q.question))));
  }

  function collapseAll() {
    setOpenKeys(new Set());
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="sticky top-0 z-10 flex flex-col gap-2 bg-zinc-50 py-3 dark:bg-zinc-950">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search — e.g. useEffect, fiber, memo, hydration"
            className="h-9 min-w-[220px] flex-1 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 focus:border-amber-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
          {DIFFICULTIES.map((d) => {
            const active = activeDiffs.has(d);
            return (
              <button
                key={d}
                onClick={() => toggleDiff(d)}
                className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? DIFFICULTY_STYLE[d].pillActive
                    : "border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
                }`}
              >
                {d}
              </button>
            );
          })}
          <div className="ml-auto flex gap-2">
            <button
              onClick={expandAll}
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
            >
              Expand all
            </button>
            <button
              onClick={collapseAll}
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
            >
              Collapse all
            </button>
          </div>
        </div>
        <p className="font-mono text-xs text-zinc-400 dark:text-zinc-600">
          {filtered.length} of {reactQuickRef.length} questions shown
        </p>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-500">No questions match your search or filters.</p>
      ) : (
        reactQuickRefCategories.map((category) => {
          const items = filtered.filter((i) => i.category === category);
          if (items.length === 0) return null;
          return (
            <section key={category} className="flex flex-col gap-2">
              <div className="flex items-baseline gap-2 border-b-2 border-zinc-900 pb-1.5 dark:border-zinc-100">
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">{category}</h3>
                <span className="font-mono text-xs text-zinc-400 dark:text-zinc-600">
                  {items.length} question{items.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                {items.map((item) => {
                  const key = cardKey(item.category, item.question);
                  const open = openKeys.has(key);
                  return (
                    <div
                      key={key}
                      className="overflow-hidden rounded-sm border border-l-[3px] border-zinc-200 dark:border-zinc-800"
                      style={{
                        borderLeftColor:
                          item.difficulty === "Basic"
                            ? "#10b981"
                            : item.difficulty === "Intermediate"
                              ? "#f59e0b"
                              : "#f43f5e",
                      }}
                    >
                      <button
                        onClick={() => toggleCard(key)}
                        className="flex w-full items-start gap-3 px-4 py-3 text-left"
                      >
                        <span className="flex-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {item.question}
                        </span>
                        <span
                          className={`mt-0.5 whitespace-nowrap rounded px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-wide ${DIFFICULTY_STYLE[item.difficulty].badge}`}
                        >
                          {item.difficulty}
                        </span>
                        <span
                          className={`mt-0.5 font-mono text-zinc-400 transition-transform dark:text-zinc-600 ${open ? "rotate-90" : ""}`}
                        >
                          &rsaquo;
                        </span>
                      </button>
                      {open && (
                        <div className="flex flex-col gap-3 border-t border-zinc-200 px-4 py-3 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
                          <p className="leading-relaxed">{item.answer}</p>
                          {item.code && <CodeBlock code={item.code} language={item.codeLanguage} />}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
