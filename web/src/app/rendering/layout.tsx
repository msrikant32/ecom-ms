import type { ReactNode } from "react";
import { RenderingNav } from "@/components/rendering/RenderingNav";

export default function RenderingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <RenderingNav />
      <p className="rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
        <code className="font-mono">next dev</code> always re-renders pages on demand, so SSG and
        ISR will look identical to SSR while running the dev server. To see the real
        frozen/cached behavior, run{" "}
        <code className="font-mono">npm run build &amp;&amp; npm run start</code>.
      </p>
      {children}
    </div>
  );
}
