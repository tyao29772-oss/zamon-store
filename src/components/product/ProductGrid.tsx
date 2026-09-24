import { ProductCard } from "@/components/product/ProductCard";
import type { Brand, Product } from "@/types";

interface ProductGridProps {
  products: Product[];
  brands: Map<string, Brand>;
  /** Birinchi ekrandagi nechta karta darhol yuklansin (LCP). */
  eagerCount?: number;
}

/** Mahsulotlar to‘ri: mobil 2, planshet 3, desktop 4 ustun. */
export function ProductGrid({ products, brands, eagerCount = 0 }: ProductGridProps) {
  return (
    <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
      {products.map((product, index) => (
        <li key={product.id}>
          <ProductCard
            product={product}
            brand={brands.get(product.brandId)}
            eager={index < eagerCount}
          />
        </li>
      ))}
    </ul>
  );
}
