import { BrandsStrip } from "@/components/home/BrandsStrip";
import { CategoryArches } from "@/components/home/CategoryArches";
import { FeaturePair } from "@/components/home/FeaturePair";
import { HeroSpotlight } from "@/components/home/HeroSpotlight";
import { ProductRail } from "@/components/home/ProductRail";
import { QuickCategories } from "@/components/home/QuickCategories";
import { TrustStrip } from "@/components/home/TrustStrip";
import { getBrands } from "@/lib/repo/brands";
import { getCategoryById } from "@/lib/repo/categories";
import {
  getNewProducts,
  getPopularProducts,
  getProductBySlug,
  getSaleProducts,
} from "@/lib/repo/products";

export default async function HomePage() {
  const [brands, phones, hero, laptop, earbuds, popular, fresh, sale] = await Promise.all([
    getBrands(),
    getCategoryById("telefonlar"),
    getProductBySlug("iphone-15-pro-max"),
    getProductBySlug("macbook-air-m3"),
    getProductBySlug("apple-airpods-pro-2"),
    getPopularProducts(8),
    getNewProducts(8),
    getSaleProducts(8),
  ]);

  const brandMap = new Map(brands.map((b) => [b.id, b]));

  return (
    <main id="main">
      {hero && <HeroSpotlight product={hero} catalogHref={phones?.href ?? "/katalog"} />}
      <QuickCategories />
      <CategoryArches />
      <ProductRail
        id="popular-title"
        eyebrow="Eng ko‘p tanlanadi"
        title="Mashhur mahsulotlar"
        href="/katalog"
        products={popular}
        brands={brandMap}
      />
      {laptop && earbuds && <FeaturePair laptop={laptop} earbuds={earbuds} />}
      <ProductRail
        id="new-title"
        eyebrow="Yangi kelganlar"
        title="Yangi mahsulotlar"
        href="/katalog"
        products={fresh}
        brands={brandMap}
      />
      <ProductRail
        id="sale-title"
        eyebrow="Aksiya"
        title="Chegirmadagi mahsulotlar"
        href="/aksiyalar"
        products={sale}
        brands={brandMap}
      />
      <BrandsStrip brands={brands} />
      <TrustStrip />
    </main>
  );
}
