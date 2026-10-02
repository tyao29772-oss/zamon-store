import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { PolicyList } from "@/components/ui/PolicyList";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { buildBreadcrumbJsonLd, toJsonLd } from "@/lib/seo";
import { getStore } from "@/lib/repo/store";

const BASE_PATH = "/maxfiylik";

export const metadata: Metadata = {
  title: "Maxfiylik siyosati",
  description: "Zamon Store qanday ma’lumot yig‘adi, qanday ishlatadi va kim bilan ulashadi.",
  alternates: { canonical: BASE_PATH },
};

export default async function PrivacyPage() {
  const store = await getStore();
  const crumbs = [{ label: "Bosh sahifa", href: "/" }, { label: "Maxfiylik siyosati" }];
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(crumbs, BASE_PATH);

  return (
    <main id="main" className="container-page pb-16 pt-6 md:pt-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(breadcrumbJsonLd) }} />
      <Breadcrumbs items={crumbs} />

      <div className="mt-4">
        <SectionHeading as="h1" eyebrow="Ma’lumotlaringiz xavfsiz" title="Maxfiylik siyosati" />
      </div>

      <div className="mt-10 max-w-2xl">
        <PolicyList items={store.privacyPolicy} />
      </div>
    </main>
  );
}
