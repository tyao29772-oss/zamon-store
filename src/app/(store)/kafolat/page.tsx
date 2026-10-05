import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { PolicyList } from "@/components/ui/PolicyList";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { buildBreadcrumbJsonLd, toJsonLd } from "@/lib/seo";
import { getStore } from "@/lib/repo/store";

const BASE_PATH = "/kafolat";

export async function generateMetadata(): Promise<Metadata> {
  const { name } = await getStore();
  return {
    title: "Kafolat shartlari",
    description: `${name}'da kafolat va qaytarish shartlari qanday ishlashi haqida to‘liq ma’lumot.`,
    alternates: { canonical: BASE_PATH },
  };
}

export default async function WarrantyPage() {
  const store = await getStore();
  const crumbs = [{ label: "Bosh sahifa", href: "/" }, { label: "Kafolat shartlari" }];
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(crumbs, BASE_PATH);

  return (
    <main id="main" className="container-page pb-16 pt-6 md:pt-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(breadcrumbJsonLd) }} />
      <Breadcrumbs items={crumbs} />

      <div className="mt-4">
        <SectionHeading as="h1" eyebrow="Ishonch bilan xarid qiling" title="Kafolat shartlari" />
      </div>

      <div className="mt-10 max-w-2xl space-y-10">
        <section aria-labelledby="warranty-title">
          <h2 id="warranty-title" className="font-display text-xl font-semibold text-ink">
            Kafolat
          </h2>
          <div className="mt-4">
            <PolicyList items={store.warrantyPolicy} />
          </div>
        </section>

        <section aria-labelledby="return-title">
          <h2 id="return-title" className="font-display text-xl font-semibold text-ink">
            Qaytarish va almashtirish
          </h2>
          <div className="mt-4">
            <PolicyList items={store.returnPolicy} />
          </div>
        </section>
      </div>
    </main>
  );
}
