import { BrandsStrip } from "@/components/home/BrandsStrip";
import { CategoryArches } from "@/components/home/CategoryArches";
import { FeaturePair } from "@/components/home/FeaturePair";
import { HeroSpotlight } from "@/components/home/HeroSpotlight";
import { ProductRail } from "@/components/home/ProductRail";
import { PromoBanners } from "@/components/home/PromoBanners";
import { QuickCategories } from "@/components/home/QuickCategories";
import { TrustStrip } from "@/components/home/TrustStrip";
import { getBrands } from "@/lib/repo/brands";
import { getHomeSettings } from "@/lib/repo/home";
import {
  getNewProducts,
  getPopularProducts,
  getProductBySlug,
  getSaleProducts,
} from "@/lib/repo/products";
import { DEFAULT_HOME } from "@/lib/settings/home-settings";

export default async function HomePage() {
  const home = await getHomeSettings();
  const [brands, chosenHero, featureProducts, popular, fresh, sale] = await Promise.all([
    getBrands(),
    getProductBySlug(home.hero.productSlug),
    Promise.all(home.featuresEnabled ? home.features.map((f) => getProductBySlug(f.productSlug)) : []),
    getPopularProducts(8),
    getNewProducts(8),
    getSaleProducts(8),
  ]);

  // Tanlangan mahsulot yashirilgan/o‘chirilgan bo‘lsa — standart, u ham bo‘lmasa eng mashhuri.
  const hero =
    chosenHero ?? (await getProductBySlug(DEFAULT_HOME.hero.productSlug)) ?? popular[0] ?? null;
  const features = home.features.flatMap((feature, index) => {
    const product = featureProducts[index];
    return product ? [{ ...feature, text: feature.text || product.shortDescription, product }] : [];
  });
  const banners = home.banners.filter((b) => b.active);
  const brandMap = new Map(brands.map((b) => [b.id, b]));

  return (
    <main id="main">
      {hero && (
        <HeroSpotlight
          product={hero}
          eyebrow={home.hero.eyebrow}
          title={chosenHero ? home.hero.title : ""}
          text={chosenHero ? home.hero.text : ""}
          secondary={home.hero.secondaryLabel ? { label: home.hero.secondaryLabel, href: home.hero.secondaryHref } : null}
        />
      )}
      <QuickCategories />
      <CategoryArches />
      <PromoBanners banners={banners} />
      <ProductRail
        id="popular-title"
        eyebrow="Eng ko‘p tanlanadi"
        title="Mashhur mahsulotlar"
        href="/katalog"
        products={popular}
        brands={brandMap}
      />
      <FeaturePair features={features} />
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
