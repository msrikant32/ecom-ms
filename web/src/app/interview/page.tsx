import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { TopicGrid } from "@/components/interview/TopicGrid";

export const metadata: Metadata = {
  title: "Interview Prep",
};

export default function InterviewIndexPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Interview Prep" }]} />

      <header className="flex flex-col gap-3">
        <p className="text-sm font-medium uppercase tracking-wide text-amber-600 dark:text-amber-400">
          Interview Prep
        </p>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Real questions, thorough answers
        </h1>
        <p className="max-w-2xl text-zinc-600 dark:text-zinc-400">
          Questions collected from actual interviews, answered comprehensively and linked back
          to working examples elsewhere on this site wherever one exists — not just an abstract
          list of buzzwords. Pick a topic below; each question still carries a round badge
          (Round 1/2/3, or General) so you know which stage it came from.
        </p>
      </header>

      <TopicGrid />
    </div>
  );
}
