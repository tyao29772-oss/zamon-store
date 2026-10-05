import type { Metadata } from "next";
import { CalendarDays, LayoutGrid, PackageCheck } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { buildBreadcrumbJsonLd, toJsonLd } from "@/lib/seo";
import { createTelegramLink } from "@/lib/telegram";
import { getCategories } from "@/lib/repo/categories";
import { getAllProducts } from "@/lib/repo/products";
import { getStore } from "@/lib/repo/store";

const BASE_PATH = "/magazin-haqida";

export async function generateMetadata(): Promise<Metadata> {
  const { name } = await getStore();
  return {
    title: "Magazin haqida",
    description: `${name} haqida: qachon ochilgan, nima sotamiz va nega bizga ishonish mumkin.`,
    alternates: { canonical: BASE_PATH },
  };
}

export default async function AboutPage() {
  const [store, products, categories] = await Promise.all([getStore(), getAllProducts(), getCategories()]);

  const stats = [
    { icon: CalendarDays, value: `${store.foundedYear}`, label: "yildan beri ishlaymiz" },
    { icon: PackageCheck, value: `${products.length}+`, label: "mahsulot katalogda" },
    { icon: LayoutGrid, value: `${categories.length}+`, label: "kategoriya" },
  ];

  const crumbs = [{ label: "Bosh sahifa", href: "/" }, { label: "Magazin haqida" }];
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(crumbs, BASE_PATH);

  return (
    <main id="main" className="container-page pb-16 pt-6 md:pt-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(breadcrumbJsonLd) }} />
      <Breadcrumbs items={crumbs} />

      <div className="mt-4">
        <SectionHeading as="h1" eyebrow={`${store.foundedYear}-yildan beri`} title="Magazin haqida" />
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_20rem]">
        <div className="max-w-2xl space-y-5">
          {store.aboutLong.map((paragraph) => (
            <p key={paragraph} className="text-[15px] leading-relaxed text-ink-muted">
              {paragraph}
            </p>
          ))}

          <div className="flex flex-wrap gap-3 pt-2">
            <ButtonLink href="/katalog">Katalogni ko‘rish</ButtonLink>
            <ButtonLink href={createTelegramLink(store.telegramUsername)} variant="outline" target="_blank" rel="noopener noreferrer">
              Telegramda yozish
            </ButtonLink>
          </div>
        </div>

        <ul className="grid content-start gap-4 sm:grid-cols-3 lg:grid-cols-1">
          {stats.map(({ icon: Icon, value, label }) => (
            <li
              key={label}
              className="flex items-center gap-4 rounded-2xl border border-line bg-surface/70 p-4"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-ink">
                <Icon className="size-5" strokeWidth={1.6} aria-hidden="true" />
              </span>
              <div>
                <p className="font-display text-xl font-semibold text-ink">{value}</p>
                <p className="text-[13px] leading-snug text-ink-muted">{label}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
