"use client";

import { useEffect, useState } from "react";

export function ClientTimestamp() {
  const [timestamp, setTimestamp] = useState<string | null>(null);

  useEffect(() => {
    // Simulates a client-side data fetch (e.g. calling an API from the
    // browser) rather than reading Date.now() synchronously, so the
    // loading state below is genuinely visible, not instantaneous.
    const id = setTimeout(() => {
      setTimestamp(new Date().toISOString());
    }, 600);
    return () => clearTimeout(id);
  }, []);

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        Rendered in the browser at
      </p>
      {timestamp ? (
        <p className="font-mono text-2xl text-zinc-900 dark:text-zinc-50">{timestamp}</p>
      ) : (
        <p className="font-mono text-2xl text-zinc-400 dark:text-zinc-600">Loading…</p>
      )}
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        View the page&apos;s raw source (not devtools) and this value won&apos;t be there at all —
        it&apos;s inserted by JavaScript after the page loads and hydrates, with a deliberate
        600ms delay here to make the loading state visible instead of instant.
      </p>
    </div>
  );
}
