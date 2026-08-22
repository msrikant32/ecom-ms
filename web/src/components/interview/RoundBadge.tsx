import { getRoundBadgeLabel } from "@/content/interview";

const ROUND_COLOR: Record<string, string> = {
  "round-1": "bg-sky-500/10 text-sky-700 dark:text-sky-400",
  "round-2": "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  "round-3": "bg-violet-500/10 text-violet-700 dark:text-violet-400",
  general: "bg-zinc-500/10 text-zinc-700 dark:text-zinc-400",
};

export function RoundBadge({ roundId }: { roundId?: string }) {
  const label = getRoundBadgeLabel(roundId);
  if (!label || !roundId) return null;
  return (
    <span
      className={`inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        ROUND_COLOR[roundId] ?? ROUND_COLOR.general
      }`}
    >
      {label}
    </span>
  );
}
