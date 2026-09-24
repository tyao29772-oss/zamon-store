import Link from "next/link";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { brandHref } from "@/lib/urls";
import type { Brand } from "@/types";

const FEATURED = ["apple", "samsung", "xiaomi", "infinix", "honor", "lenovo", "hp", "asus"];

/** Brendlar bloki: har biri o‘z brend sahifasiga olib boradi. */
export function BrandsStrip({ brands }: { brands: Brand[] }) {
  const items = FEATURED.map((id) => brands.find((b) => b.id === id)).filter(
    (b): b is Brand => b !== undefined,
  );

  return (
    <section aria-labelledby="brands-title" className="container-page pt-16 md:pt-24">
      <div id="brands-title">
        <SectionHeading eyebrow="Ishonchli brendlar" title="Brend bo‘yicha tanlang" />
      </div>
      <ul className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-[28px] border border-line bg-line sm:grid-cols-4">
        {items.map((brand) => (
          <li key={brand.id} className="bg-surface/80">
            <Link
              href={brandHref(brand.slug)}
              className="flex h-28 items-center justify-center px-4 text-center font-display text-[28px] font-semibold tracking-tight text-ink transition-colors hover:bg-white hover:text-accent-ink md:h-36 md:text-4xl"
            >
              {brand.name}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
