import type { PingSample } from "./usePingMonitor";

function colorFor(latencyMs: number): string {
  if (latencyMs < 30) return "bg-emerald-500";
  if (latencyMs < 100) return "bg-amber-500";
  return "bg-red-500";
}

export function PingStrip({
  samples,
  label,
}: {
  samples: PingSample[];
  label: string;
}) {
  const max = samples.length > 0 ? Math.max(...samples.map((s) => s.latencyMs)) : 0;
  const avg =
    samples.length > 0
      ? samples.reduce((sum, s) => sum + s.latencyMs, 0) / samples.length
      : 0;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span>{label}</span>
        {samples.length > 0 && (
          <span>
            avg {avg.toFixed(0)}ms · max {max}ms
          </span>
        )}
      </div>
      <div className="flex h-8 items-end gap-[2px]">
        {samples.length === 0 ? (
          <span className="text-xs italic text-zinc-400 dark:text-zinc-600">
            (not running — start an upload to see live ping latency here)
          </span>
        ) : (
          samples.map((s) => (
            <div
              key={s.id}
              title={`${Math.round(s.latencyMs)}ms`}
              className={`w-1 shrink-0 rounded-t transition-colors ${colorFor(s.latencyMs)}`}
              style={{ height: `${Math.min(100, (s.latencyMs / 200) * 100)}%` }}
            />
          ))
        )}
      </div>
    </div>
  );
}
