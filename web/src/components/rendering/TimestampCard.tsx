export function TimestampCard({
  label,
  timestamp,
  detail,
}: {
  label: string;
  timestamp: string;
  detail: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="font-mono text-2xl text-zinc-900 dark:text-zinc-50">{timestamp}</p>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{detail}</p>
    </div>
  );
}
