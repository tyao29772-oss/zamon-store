import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { PolicyList } from "@/components/ui/PolicyList";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { formatPrice } from "@/lib/format";
import { buildBreadcrumbJsonLd, toJsonLd } from "@/lib/seo";
import { getStore } from "@/lib/repo/store";

const BASE_PATH = "/yetkazib-berish";

export const metadata: Metadata = {
  title: "Yetkazib berish shartlari",
  description: "Zamon Store'da yetkazib berish qanday ishlaydi, narxlar va muddatlar.",
  alternates: { canonical: BASE_PATH },
};

export default async function DeliveryPage() {
  const store = await getStore();
  const crumbs = [{ label: "Bosh sahifa", href: "/" }, { label: "Yetkazib berish shartlari" }];
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(crumbs, BASE_PATH);

  return (
    <main id="main" className="container-page pb-16 pt-6 md:pt-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(breadcrumbJsonLd) }} />
      <Breadcrumbs items={crumbs} />

      <div className="mt-4">
        <SectionHeading as="h1" eyebrow="Toshkent va viloyatlarga" title="Yetkazib berish shartlari" />
      </div>

      <div className="mt-10 max-w-2xl space-y-10">
        <section aria-labelledby="delivery-policy-title">
          <h2 id="delivery-policy-title" className="font-display text-xl font-semibold text-ink">
            Qanday ishlaydi
          </h2>
          <div className="mt-4">
            <PolicyList items={store.deliveryPolicy} />
          </div>
        </section>

        <section aria-labelledby="delivery-zones-title">
          <h2 id="delivery-zones-title" className="font-display text-xl font-semibold text-ink">
            Hudud bo‘yicha narxlar
          </h2>
          <dl className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface/60">
            {store.deliveryZones.map((zone) => (
              <div key={zone.name} className="flex flex-col gap-1 px-4 py-3.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                <div>
                  <dt className="text-[14px] font-medium text-ink">{zone.name}</dt>
                  {zone.note && <p className="mt-0.5 text-[12px] text-ink-muted">{zone.note}</p>}
                </div>
                <dd className="shrink-0 text-[14px] font-semibold text-ink">{formatPrice(zone.price)}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </main>
  );
}
