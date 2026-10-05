import type { Metadata } from "next";
import { Camera, Clock, MapPin, Navigation, Phone, Send } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { formatUzPhone } from "@/lib/phone";
import { buildBreadcrumbJsonLd, toJsonLd } from "@/lib/seo";
import { createTelegramLink } from "@/lib/telegram";
import { getStore } from "@/lib/repo/store";

const BASE_PATH = "/aloqa";

export const metadata: Metadata = {
  title: "Aloqa",
  description: "Zamon Store bilan bog‘lanish: telefon, Telegram, Instagram va manzil.",
  alternates: { canonical: BASE_PATH },
};

export default async function ContactPage() {
  const store = await getStore();
  // Koordinata bo‘lsa — aniq nuqta, aks holda (admin manzilni o‘zgartirgan) — manzil bo‘yicha qidiruv.
  const mapsUrl =
    store.latitude && store.longitude
      ? `https://www.google.com/maps/search/?api=1&query=${store.latitude},${store.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.address)}`;
  // Instagram ixtiyoriy (sozlamalarda bo‘sh qoldirilishi mumkin) — bo‘sh bo‘lsa ko‘rsatilmaydi.
  const instagramHandle = store.instagramUrl
    ? store.instagramUrl.replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/+$/, "")
    : "";

  const crumbs = [{ label: "Bosh sahifa", href: "/" }, { label: "Aloqa" }];
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(crumbs, BASE_PATH);

  return (
    <main id="main" className="container-page pb-16 pt-6 md:pt-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(breadcrumbJsonLd) }} />
      <Breadcrumbs items={crumbs} />

      <div className="mt-4">
        <SectionHeading as="h1" eyebrow="Savolingiz bormi?" title="Aloqa" />
        <p className="mt-3 max-w-xl text-[15px] text-ink-muted">
          Buyurtma, mavjudlik yoki kafolat bo‘yicha savollaringiz bo‘lsa — quyidagi usullardan istalganida
          bog‘lanishingiz mumkin. Eng tezkor javob — Telegram orqali.
        </p>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_22rem]">
        <ul className="grid gap-4 sm:grid-cols-2">
          <li className="rounded-2xl border border-line bg-surface/70 p-5">
            <span className="flex size-11 items-center justify-center rounded-full bg-accent-soft text-accent-ink">
              <Phone className="size-5" strokeWidth={1.6} aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-sm font-semibold text-ink">Telefon</h2>
            <a href={`tel:${store.phone}`} className="mt-1 block text-[15px] text-ink-muted hover:text-ink">
              {formatUzPhone(store.phone)}
            </a>
          </li>

          <li className="rounded-2xl border border-line bg-surface/70 p-5">
            <span className="flex size-11 items-center justify-center rounded-full bg-accent-soft text-accent-ink">
              <Send className="size-5" strokeWidth={1.6} aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-sm font-semibold text-ink">Telegram</h2>
            <a
              href={createTelegramLink(store.telegramUsername)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 block text-[15px] text-ink-muted hover:text-ink"
            >
              @{store.telegramUsername}
            </a>
          </li>

          {instagramHandle && (
            <li className="rounded-2xl border border-line bg-surface/70 p-5">
              <span className="flex size-11 items-center justify-center rounded-full bg-accent-soft text-accent-ink">
                <Camera className="size-5" strokeWidth={1.6} aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-sm font-semibold text-ink">Instagram</h2>
              <a
                href={store.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 block text-[15px] text-ink-muted hover:text-ink"
              >
                @{instagramHandle}
              </a>
            </li>
          )}

          <li className="rounded-2xl border border-line bg-surface/70 p-5">
            <span className="flex size-11 items-center justify-center rounded-full bg-accent-soft text-accent-ink">
              <Clock className="size-5" strokeWidth={1.6} aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-sm font-semibold text-ink">Ish vaqti</h2>
            <div className="mt-1 text-[15px] text-ink-muted">
              {store.workingHours.map((item) => (
                <p key={item.label}>
                  {item.label}: {item.hours}
                </p>
              ))}
            </div>
          </li>
        </ul>

        <div className="rounded-[28px] border border-line bg-surface/70 p-5">
          <div
            aria-hidden="true"
            className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_1px_1px,rgba(60,40,20,0.18)_1px,transparent_1px)] bg-page [background-size:14px_14px]"
          >
            <span className="flex size-14 items-center justify-center rounded-full bg-ink text-white shadow-pop">
              <MapPin className="size-6" aria-hidden="true" />
            </span>
          </div>

          <h2 className="mt-4 text-sm font-semibold text-ink">Manzil</h2>
          <p className="mt-1 text-[15px] leading-relaxed text-ink-muted">{store.address}</p>
          {store.landmark && <p className="mt-1 text-[13px] text-ink-muted">{store.landmark}</p>}

          {mapsUrl && (
            <ButtonLink href={mapsUrl} target="_blank" rel="noopener noreferrer" variant="outline" className="mt-4 w-full">
              <Navigation className="size-4" aria-hidden="true" />
              Xaritada ochish
            </ButtonLink>
          )}
        </div>
      </div>
    </main>
  );
}
