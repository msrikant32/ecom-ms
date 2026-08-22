import type { Metadata } from "next";
import Link from "next/link";
import { renderingModes } from "@/content/renderingModes";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

export const metadata: Metadata = {
  title: "Rendering Strategies",
};

export default function RenderingIndexPage() {
  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Rendering Strategies" }]} />
      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          CSR, SSR, SSG, and ISR
        </h1>
        <p className="max-w-2xl text-zinc-600 dark:text-zinc-400">
          Four real pages, four real rendering behaviors. Each one renders a timestamp using a
          different Next.js rendering mode — pick one below, then reload it (in a production
          build) to see exactly when and where that timestamp actually gets computed.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {renderingModes.map((mode, index) => (
          <Link
            key={mode.id}
            href={`/rendering/${mode.id}`}
            className="group flex flex-col gap-2 rounded-xl border border-zinc-200 p-5 transition-colors hover:border-violet-400 dark:border-zinc-800 dark:hover:border-violet-600"
          >
            <span className="text-xs font-medium text-zinc-400 dark:text-zinc-600">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h2 className="text-lg font-semibold text-zinc-900 group-hover:text-violet-600 dark:text-zinc-50 dark:group-hover:text-violet-400">
              {mode.title}
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{mode.blurb}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
