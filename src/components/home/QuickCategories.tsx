import Link from "next/link";
import { getCategoryById } from "@/lib/repo/categories";

const QUICK_IDS = [
  "telefonlar-iphone",
  "telefonlar-samsung",
  "telefonlar-infinix",
  "telefonlar-honor",
  "telefonlar-redmi-xiaomi",
  "aksessuarlar-chexollar",
  "aksessuarlar-zaryadchiklar",
  "aksessuarlar-simsiz-quloqchinlar",
  "laptoplar",
];

/** Tezkor kategoriyalar: gorizontal siljiydigan chiplar. */
export async function QuickCategories() {
  const categories = (await Promise.all(QUICK_IDS.map(getCategoryById))).filter(
    (c): c is NonNullable<typeof c> => c !== null,
  );

  return (
    <nav aria-label="Tezkor kategoriyalar" className="container-page pt-6">
      <ul className="-mx-4 flex snap-x scroll-px-4 gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:flex-wrap md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden">
        {categories.map((category) => (
          <li key={category.id} className="snap-start">
            <Link
              href={category.href}
              className="inline-flex h-11 items-center whitespace-nowrap rounded-full border border-line bg-surface/70 px-5 text-sm font-medium text-ink transition-colors hover:border-ink/40 hover:bg-white"
            >
              {category.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
