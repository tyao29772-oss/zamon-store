import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ProductRail } from "@/components/home/ProductRail";
import { ProductView } from "@/components/product/ProductView";
import { SpecsTable } from "@/components/product/SpecsTable";
import { findVariant, getDefaultVariant } from "@/lib/product";
import { buildBreadcrumbJsonLd, buildProductJsonLd, toJsonLd } from "@/lib/seo";
import { getBrandById, getBrands } from "@/lib/repo/brands";
import { getCategoryById, getCategoryChain } from "@/lib/repo/categories";
import {
  getAllProducts,
  getBundleProducts,
  getProductBySlug,
  getRelatedProducts,
} from "@/lib/repo/products";
import { getStore } from "@/lib/repo/store";
import { productHref } from "@/lib/urls";

export async function generateStaticParams() {
  const products = await getAllProducts();
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/mahsulot/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};

  const title = product.seo?.title ?? product.name;
  const description = product.seo?.description ?? product.shortDescription;
  const href = productHref(product.slug);

  return {
    title,
    description,
    alternates: { canonical: href },
    openGraph: {
      title,
      description,
      url: href,
      ...(product.images[0] ? { images: [{ url: product.images[0] }] } : {}),
    },
  };
}

export default async function ProductPage({
  params,
  searchParams,
}: PageProps<"/mahsulot/[slug]">) {
  const [{ slug }, sParams] = await Promise.all([params, searchParams]);
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const variantParam = sParams.v;
  const initialVariantId = Array.isArray(variantParam) ? variantParam[0] : variantParam;
  // Havoladagi variant ID noto‘g‘ri bo‘lsa ham xato bermaydi — shunchaki standart variant ko‘rsatiladi.
  const initialVariant = findVariant(product, initialVariantId) ?? getDefaultVariant(product);

  const [brand, category, chain, store, related, bundle, brandList] = await Promise.all([
    getBrandById(product.brandId),
    getCategoryById(product.categoryId),
    getCategoryChain(product.categoryId),
    getStore(),
    getRelatedProducts(product, 8),
    getBundleProducts(product, 6),
    getBrands(),
  ]);

  const brands = new Map(brandList.map((b) => [b.id, b]));
  const jsonLd = buildProductJsonLd(product, brand);
  const productPath = productHref(product.slug);
  const crumbs = [
    { label: "Bosh sahifa", href: "/" },
    { label: "Katalog", href: "/katalog" },
    ...chain.map((c) => ({ label: c.name, href: c.href })),
    { label: product.name },
  ];
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(crumbs, productPath);

  return (
    <main id="main" className="container-page pb-10 pt-6 lg:pb-16 md:pt-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(breadcrumbJsonLd) }} />

      <Breadcrumbs items={crumbs} />

      <div className="mt-6">
        <ProductView
          product={product}
          brand={brand}
          categoryName={category?.name ?? ""}
          categoryHref={category?.href ?? "/katalog"}
          store={store}
          initialVariantId={initialVariant.id}
        />
      </div>

      <div className="mt-16 grid gap-10 lg:grid-cols-[1fr_18rem] lg:gap-16">
        <div className="space-y-10">
          <section aria-labelledby="description-title">
            <h2 id="description-title" className="font-display text-2xl font-semibold text-ink">
              Mahsulot haqida
            </h2>
            <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-ink-muted">{product.description}</p>
          </section>

          {product.specs.length > 0 && (
            <section aria-labelledby="specs-title">
              <h2 id="specs-title" className="font-display text-2xl font-semibold text-ink">
                Texnik xususiyatlar
              </h2>
              <div className="mt-4">
                <SpecsTable specs={product.specs} />
              </div>
            </section>
          )}
        </div>
      </div>

      <ProductRail
        id="related-title"
        eyebrow="Sizga yoqishi mumkin"
        title="O‘xshash mahsulotlar"
        href={category?.href}
        products={related}
        brands={brands}
      />

      <ProductRail
        id="bundle-title"
        eyebrow="Birga qulayroq"
        title="Bu mahsulot bilan birga olishadi"
        products={bundle}
        brands={brands}
      />
    </main>
  );
}
