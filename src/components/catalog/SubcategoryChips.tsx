import Link from "next/link";
import type { ResolvedCategory } from "@/types";

export function SubcategoryChips({
  categories,
  activeId,
}: {
  categories: ResolvedCategory[];
  activeId?: string;
}) {
  if (categories.length === 0) return null;

  return (
    <ul className="-mx-4 flex snap-x scroll-px-4 gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:flex-wrap md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden">
      {categories.map((category) => {
        const active = category.id === activeId;
        return (
          <li key={category.id} className="snap-start">
            <Link
              href={category.href}
              aria-current={active ? "page" : undefined}
              className={`inline-flex h-10 items-center whitespace-nowrap rounded-full border px-4 text-[13px] font-medium transition-colors ${
                active
                  ? "border-ink bg-ink text-white"
                  : "border-line bg-surface/70 text-ink hover:border-ink/40 hover:bg-white"
              }`}
            >
              {category.name}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
