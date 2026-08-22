import {
  getAdjacentRenderingModes,
  getRenderingMode,
  type RenderingModeId,
} from "@/content/renderingModes";
import { ClientTimestamp } from "@/components/rendering/ClientTimestamp";
import { TimestampCard } from "@/components/rendering/TimestampCard";
import { Breadcrumbs } from "./Breadcrumbs";
import { Pager } from "./Pager";

const SERVER_MODE_COPY: Record<Exclude<RenderingModeId, "csr">, { label: string; detail: string }> = {
  ssr: {
    label: "Rendered on the server at",
    detail:
      "Reload the page (in a production build) — this value changes on every single reload, computed fresh on the server for each request.",
  },
  ssg: {
    label: "Rendered at build time (frozen)",
    detail:
      "Reload the page (in a production build) as many times as you like — this value never changes until the app is rebuilt with `next build`.",
  },
  isr: {
    label: "Rendered at build time, revalidated every 10s",
    detail:
      "Reload the page (in a production build) repeatedly within 10 seconds — frozen. Wait past 10 seconds and reload again — the first request after the window triggers a background regeneration, and soon after, a new frozen timestamp takes over.",
  },
};

// Route segment config (`export const dynamic`/`revalidate`) has to stay a
// literal export in each page.tsx file — Next.js reads it statically and
// won't pick it up from a shared component — but everything else about
// these four pages is identical in shape, so it lives here once.
export function RenderingPageBody({ modeId }: { modeId: RenderingModeId }) {
  const mode = getRenderingMode(modeId);
  const { prev, next } = getAdjacentRenderingModes(modeId);

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Rendering Strategies", href: "/rendering" },
          { label: mode.title },
        ]}
      />
      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{mode.title}</h1>
        <p className="max-w-2xl text-zinc-600 dark:text-zinc-400">{mode.intro}</p>
      </header>
      {modeId === "csr" ? (
        <ClientTimestamp />
      ) : (
        <TimestampCard
          label={SERVER_MODE_COPY[modeId].label}
          timestamp={new Date().toISOString()}
          detail={SERVER_MODE_COPY[modeId].detail}
        />
      )}
      <Pager
        prev={prev && { href: `/rendering/${prev.id}`, label: prev.title }}
        next={next && { href: `/rendering/${next.id}`, label: next.title }}
      />
    </div>
  );
}
