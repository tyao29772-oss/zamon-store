import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { hrefSetPage } from "@/lib/catalog";

/** Sahifa raqamlari ro‘yxati, uzun bo‘lsa o‘rtasi «…» bilan qisqartiriladi. */
function getPageList(page: number, totalPages: number): (number | "…")[] {
  const pages = new Set<number>([1, totalPages, page, page - 1, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);

  const result: (number | "…")[] = [];
  let previous = 0;
  for (const p of sorted) {
    if (previous && p - previous > 1) result.push("…");
    result.push(p);
    previous = p;
  }
  return result;
}

function PageLink({
  href,
  active,
  disabled,
  ariaLabel,
  children,
}: {
  href: string;
  active?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  children: React.ReactNode;
}) {
  const base = "inline-flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-semibold transition-colors";
  if (disabled) {
    return (
      <span aria-hidden="true" className={`${base} cursor-not-allowed text-ink-muted/40`}>
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      aria-current={active ? "page" : undefined}
      className={`${base} ${active ? "bg-ink text-white" : "text-ink hover:bg-surface-muted"}`}
    >
      {children}
    </Link>
  );
}

export function Pagination({
  basePath,
  sp,
  page,
  totalPages,
}: {
  basePath: string;
  sp: URLSearchParams;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;
  const pages = getPageList(page, totalPages);

  return (
    <nav aria-label="Sahifalash" className="mt-10 flex items-center justify-center gap-1.5">
      <PageLink href={hrefSetPage(basePath, sp, page - 1)} disabled={page <= 1} ariaLabel="Oldingi sahifa">
        <ChevronLeft className="size-4" aria-hidden="true" />
      </PageLink>
      {pages.map((p, index) =>
        p === "…" ? (
          <span key={`gap-${index}`} className="px-1 text-ink-muted" aria-hidden="true">
            …
          </span>
        ) : (
          <PageLink key={p} href={hrefSetPage(basePath, sp, p)} active={p === page}>
            {p}
          </PageLink>
        ),
      )}
      <PageLink href={hrefSetPage(basePath, sp, page + 1)} disabled={page >= totalPages} ariaLabel="Keyingi sahifa">
        <ChevronRight className="size-4" aria-hidden="true" />
      </PageLink>
    </nav>
  );
}
