import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  /** Omit on the last item — it renders as plain text, not a link. */
  href?: string;
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-zinc-500 dark:text-zinc-400"
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={index} className="flex items-center gap-1.5">
            {index > 0 && (
              <span aria-hidden="true" className="text-zinc-300 dark:text-zinc-700">
                /
              </span>
            )}
            {item.href && !isLast ? (
              <Link href={item.href} className="hover:text-zinc-700 dark:hover:text-zinc-300">
                {item.label}
              </Link>
            ) : (
              <span
                aria-current={isLast ? "page" : undefined}
                className={isLast ? "font-medium text-zinc-900 dark:text-zinc-100" : undefined}
              >
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
