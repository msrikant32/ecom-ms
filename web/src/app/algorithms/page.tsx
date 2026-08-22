import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { BigOPlayground } from "@/components/algorithms/BigOPlayground";

export const metadata: Metadata = {
  title: "Algorithms & Big O",
};

const CONCEPTS = [
  {
    level: "Beginner",
    color: "text-emerald-600 dark:text-emerald-400",
    points: [
      {
        title: "Big O describes how work grows as input grows — not how fast the code runs today",
        detail:
          "Big O isn't a stopwatch measurement — the same O(n) function can be faster or slower than another O(n) function in absolute terms depending on hardware, language, constants. What Big O actually describes is the SHAPE of the growth curve as input size increases — which is what determines whether an algorithm is still usable when n goes from 100 to 100,000,000, regardless of which machine runs it.",
      },
      {
        title: "Time complexity — how the number of OPERATIONS grows with input size",
        detail:
          "Not wall-clock time (which depends on hardware) — the number of basic operations the algorithm performs, expressed as a function of n, the input size. A single loop over an array of n items does roughly n operations — that's O(n), regardless of whether the array holds 10 items or 10 million.",
      },
      {
        title: "Space complexity — how much EXTRA memory grows with input size",
        detail:
          "How much additional memory an algorithm needs beyond the input itself, as a function of n. A function that just scans an array and returns a max uses O(1) extra space (one variable, regardless of array size); a function that builds a new array the same size as the input uses O(n) extra space.",
      },
    ],
  },
  {
    level: "Intermediate",
    color: "text-amber-600 dark:text-amber-400",
    points: [
      {
        title: "Drop constants and lower-order terms — Big O describes the DOMINANT growth term",
        detail:
          "An algorithm that does 3n + 7 operations is still O(n) — as n grows large, the +7 and the ×3 become irrelevant next to how the TREND scales. An algorithm doing n² + n operations is O(n²) — the n term becomes insignificant next to n² once n is large enough. This is precisely why Big O is written as O(n), not O(3n + 7).",
      },
      {
        title: "Best, worst, and average case are genuinely different questions",
        detail:
          "Linear search's best case is O(1) (the target happens to be first), worst case is O(n) (it's last, or absent). Big O in interviews almost always means WORST case unless stated otherwise, since that's the guarantee that actually matters for correctness under adversarial or unlucky input.",
      },
      {
        title: "Nested loops over the SAME input multiply; sequential loops add",
        detail:
          "Two nested loops each running n times is n × n = O(n²) — for every outer iteration, the whole inner loop runs. Two SEPARATE, sequential loops each running n times is n + n = O(2n), which simplifies to O(n) — they don't multiply because neither is nested inside the other.",
      },
    ],
  },
  {
    level: "Advanced / interview-ready",
    color: "text-rose-600 dark:text-rose-400",
    points: [
      {
        title: "Amortized analysis — a single expensive operation, spread thin across many cheap ones",
        detail:
          "A dynamic array's push() is usually O(1), but occasionally triggers an O(n) resize (allocate a bigger backing array, copy everything over) when it runs out of capacity. Amortized analysis shows that resize cost, spread across all the pushes since the last resize, averages out to O(1) per push over any long sequence of operations — the occasional expensive operation doesn't change the AMORTIZED per-operation cost.",
      },
      {
        title: "Time/space tradeoffs are a real, constant design decision — not free lunches",
        detail:
          "Memoizing recursive Fibonacci turns O(2ⁿ) time into O(n) time by trading O(n) additional space to cache results already computed — a huge, worthwhile win here, but not universal: sometimes the memory a cache costs is the actual constraint (embedded systems, huge datasets), and recomputing is cheaper than storing. Naming which resource you're optimizing for, and why, is what a strong answer sounds like.",
      },
      {
        title: "The two questions the playground below is built to make visceral",
        detail:
          "Why does an interviewer care so much about turning an O(n²) solution into O(n log n) or O(n)? Because at small n the difference is invisible — at real-world n (millions of rows, users, requests) it's the difference between a request finishing in milliseconds and one that never finishes at all. Drag the slider below past n=15 and watch exactly how fast that gap opens.",
      },
    ],
  },
];

export default function AlgorithmsPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Algorithms & Big O" }]} />

      <header className="flex flex-col gap-3">
        <p className="text-sm font-medium uppercase tracking-wide text-violet-600 dark:text-violet-400">
          Practical Implementation · Simulated
        </p>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Big O, time & space complexity — visualized
        </h1>
        <p className="max-w-2xl text-zinc-600 dark:text-zinc-400">
          The single hardest thing about Big O to internalize from text alone is how VIOLENTLY
          different growth rates diverge as input size grows. The playground below computes real
          operation counts for six real code patterns, live, as you drag the slider — not a
          pre-rendered chart.
        </p>
      </header>

      {CONCEPTS.map((section) => (
        <section key={section.level} className="flex flex-col gap-3">
          <h2 className={`text-sm font-semibold uppercase tracking-wide ${section.color}`}>{section.level}</h2>
          <div className="flex flex-col gap-3">
            {section.points.map((p) => (
              <div key={p.title} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{p.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{p.detail}</p>
              </div>
            ))}
          </div>
        </section>
      ))}

      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium uppercase tracking-wide text-violet-600 dark:text-violet-400">
            Try it — hands-on
          </p>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Big O playground</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Drag the slider. Click any row to see the real code behind that complexity class and
            why it lands there.
          </p>
        </div>
        <BigOPlayground />
      </section>

      <p className="text-sm text-zinc-500 dark:text-zinc-500">
        <Link href="/interview/topics/dsa" className="text-violet-600 hover:underline dark:text-violet-400">
          DSA interview questions →
        </Link>{" "}
        — Big O fundamentals, complexity analysis walkthroughs, and classic problems with worked
        solutions.
      </p>
    </div>
  );
}
