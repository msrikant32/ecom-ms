import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

export interface PagerEntry {
  href: string;
  label: string;
  /** Small context line above the title — e.g. a category or round. Omit for sections with no natural grouping. */
  eyebrow?: string;
}

function PagerCard({ entry, direction }: { entry: PagerEntry; direction: "prev" | "next" }) {
  const isPrev = direction === "prev";
  return (
    <Link
      href={entry.href}
      className={`group flex flex-1 items-center gap-3 rounded-xl border border-zinc-200 p-4 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600 ${
        isPrev ? "" : "flex-row-reverse text-right"
      }`}
    >
      {isPrev ? (
        <ArrowLeft
          className="h-4 w-4 shrink-0 text-zinc-400 transition-transform group-hover:-translate-x-0.5 group-hover:text-sky-500 dark:text-zinc-600 dark:group-hover:text-sky-400"
          strokeWidth={2}
        />
      ) : (
        <ArrowRight
          className="h-4 w-4 shrink-0 text-zinc-400 transition-transform group-hover:translate-x-0.5 group-hover:text-sky-500 dark:text-zinc-600 dark:group-hover:text-sky-400"
          strokeWidth={2}
        />
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[10.5px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-600">
          {isPrev ? "Previous" : "Next"}
          {entry.eyebrow ? ` · ${entry.eyebrow}` : ""}
        </span>
        <span className="line-clamp-2 text-sm font-medium text-zinc-700 group-hover:text-sky-600 dark:text-zinc-300 dark:group-hover:text-sky-400">
          {entry.label}
        </span>
      </div>
    </Link>
  );
}

export function Pager({ prev, next }: { prev?: PagerEntry; next?: PagerEntry }) {
  if (!prev && !next) return null;

  return (
    <div className="flex flex-col gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800 sm:flex-row">
      {prev ? <PagerCard entry={prev} direction="prev" /> : <div className="hidden flex-1 sm:block" />}
      {next ? <PagerCard entry={next} direction="next" /> : <div className="hidden flex-1 sm:block" />}
    </div>
  );
}
