import type { Metadata } from "next";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { StoreShell } from "@/components/layout/StoreShell";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getBrands } from "@/lib/repo/brands";
import { getRootCategories } from "@/lib/repo/categories";
import { getPopularProducts } from "@/lib/repo/products";

export const metadata: Metadata = {
  title: "Sahifa topilmadi",
  robots: { index: false },
};

export default async function NotFound() {
  const [roots, brands, popular] = await Promise.all([
    getRootCategories(),
    getBrands(),
    getPopularProducts(4),
  ]);
  const brandMap = new Map(brands.map((b) => [b.id, b]));

  // Ildizdagi 404 do‘kon layout'idan tashqarida chiziladi — ramka shu yerda beriladi.
  return (
    <StoreShell>
      <main id="main" className="container-page pt-10 md:pt-16">
        <EmptyState
          icon={SearchX}
          title="Sahifa topilmadi"
          text="Kechirasiz, bunday sahifa yo‘q yoki u ko‘chirilgan. Bosh sahifaga qayting yoki quyidagi bo‘limlardan birini tanlang."
        >
          <ButtonLink href="/">Bosh sahifaga</ButtonLink>
          {roots.map((category) => (
            <ButtonLink key={category.id} href={category.href} variant="outline">
              {category.name}
            </ButtonLink>
          ))}
        </EmptyState>

        {popular.length > 0 && (
          <section aria-labelledby="popular-404" className="pt-16">
            <div id="popular-404">
              <SectionHeading eyebrow="Sizga yoqishi mumkin" title="Mashhur mahsulotlar" />
            </div>
            <div className="mt-8">
              <ProductGrid products={popular} brands={brandMap} />
            </div>
            <p className="mt-6 text-center text-sm text-ink-muted">
              Kerakli narsani topolmadingizmi?{" "}
              <Link href="/qidiruv" className="font-semibold text-accent-ink underline-offset-4 hover:underline">
                Qidiruvdan foydalaning
              </Link>
            </p>
          </section>
        )}
      </main>
    </StoreShell>
  );
}
