import { ProductCard } from "@/components/product/ProductCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { Brand, Product } from "@/types";

interface ProductRailProps {
  id: string;
  eyebrow: string;
  title: string;
  /** Bo‘lmasa «Hammasini ko‘rish» havolasi chiqmaydi. */
  href?: string;
  products: Product[];
  brands: Map<string, Brand>;
}

/** Gorizontal siljiydigan mahsulotlar qatori (mobilda barmoq bilan, desktopda ~4 ta ko‘rinadi). */
export function ProductRail({ id, eyebrow, title, href, products, brands }: ProductRailProps) {
  if (products.length === 0) return null;

  return (
    <section aria-labelledby={id} className="container-page pt-16 md:pt-24">
      <div id={id}>
        <SectionHeading eyebrow={eyebrow} title={title} href={href} />
      </div>
      <ul className="-mx-4 -mb-4 mt-8 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-10 [scrollbar-width:none] md:mx-0 md:gap-4 md:px-0 [&::-webkit-scrollbar]:hidden">
        {products.map((product) => (
          <li key={product.id} className="w-[200px] shrink-0 snap-start sm:w-[240px] lg:w-[calc((100%-48px)/4)]">
            <ProductCard product={product} brand={brands.get(product.brandId)} />
          </li>
        ))}
      </ul>
    </section>
  );
}
