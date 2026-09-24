import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Yo‘l" className="flex flex-wrap items-center gap-x-1 gap-y-0.5 text-[13px] text-ink-muted">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="flex items-center gap-1">
          {index > 0 && <ChevronRight className="size-3.5 shrink-0" aria-hidden="true" />}
          {item.href ? (
            <Link href={item.href} className="transition-colors hover:text-ink">
              {item.label}
            </Link>
          ) : (
            <span aria-current="page" className="font-medium text-ink">
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
