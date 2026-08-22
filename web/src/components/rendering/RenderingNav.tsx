"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { renderingModes } from "@/content/renderingModes";

export function RenderingNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2 border-b border-zinc-200 pb-4 dark:border-zinc-800">
      {renderingModes.map((mode) => {
        const href = `/rendering/${mode.id}`;
        const isActive = pathname === href;
        return (
          <Link
            key={mode.id}
            href={href}
            className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
              isActive
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            {mode.id.toUpperCase()}
          </Link>
        );
      })}
    </nav>
  );
}
