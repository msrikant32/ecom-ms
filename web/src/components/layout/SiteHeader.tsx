"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/topics", label: "Node.js Concepts" },
  { href: "/upload", label: "Large File Upload" },
  { href: "/rate-limiting", label: "Rate Limiting" },
  { href: "/databases", label: "Databases" },
  { href: "/docker", label: "Docker" },
  { href: "/algorithms", label: "Algorithms & Big O" },
  { href: "/rendering", label: "Rendering Strategies" },
  { href: "/interview", label: "Interview Prep" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:border-zinc-800 dark:bg-zinc-950/85 dark:supports-[backdrop-filter]:bg-zinc-950/70">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
        <Link href="/" className="shrink-0 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          MERN Learning Lab
        </Link>
        <nav aria-label="Primary" className="flex flex-wrap gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                  isActive
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
