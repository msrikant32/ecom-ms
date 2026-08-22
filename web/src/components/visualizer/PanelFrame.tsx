import type { ReactNode } from "react";

export function PanelFrame({
  title,
  hint,
  accentClassName,
  children,
}: {
  title: string;
  hint?: string;
  accentClassName?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h3
          className={`text-xs font-semibold uppercase tracking-wide ${
            accentClassName ?? "text-zinc-300"
          }`}
        >
          {title}
        </h3>
        {hint && <span className="text-[10px] text-zinc-500">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

export function EmptyHint({ text }: { text: string }) {
  return <p className="text-[11px] italic text-zinc-600">{text}</p>;
}
