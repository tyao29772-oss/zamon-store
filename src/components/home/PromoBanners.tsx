import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { externalLinkProps } from "@/lib/urls";
import type { BannerTheme } from "@/types";

export interface PromoBannerView {
  id: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  href: string;
  theme: BannerTheme;
  image: string;
}

const THEMES: Record<BannerTheme, { card: string; text: string; glow: string; button: "light" | "dark" }> = {
  dark: {
    card: "bg-dark text-white",
    text: "text-white/65",
    glow: "bg-[radial-gradient(circle,rgba(166,124,85,0.35),transparent_68%)]",
    button: "light",
  },
  blue: {
    card: "bg-gradient-to-br from-[#16304a] to-[#2a5b86] text-white",
    text: "text-white/70",
    glow: "bg-[radial-gradient(circle,rgba(140,200,255,0.3),transparent_68%)]",
    button: "light",
  },
  light: {
    card: "border border-line bg-gradient-to-br from-[#f6efe6] to-[#e9dccb] text-ink",
    text: "text-ink/70",
    glow: "bg-[radial-gradient(circle,rgba(255,255,255,0.8),transparent_68%)]",
    button: "dark",
  },
};

/** Bitta reklama banneri. Admin panelda jonli ko‘rinish uchun ham ishlatiladi. */
export function PromoBanner({ banner }: { banner: PromoBannerView }) {
  const theme = THEMES[banner.theme] ?? THEMES.dark;

  return (
    <article className={`grain relative isolate flex h-full min-h-[220px] items-center gap-4 overflow-hidden rounded-[32px] p-7 md:p-9 ${theme.card}`}>
      <div aria-hidden="true" className={`pointer-events-none absolute -right-24 -top-24 size-[360px] rounded-full ${theme.glow}`} />
      <div className="relative min-w-0 flex-1">
        <h3 className="font-display text-[26px] font-semibold leading-[1.08] tracking-tight [overflow-wrap:anywhere] md:text-[32px]">{banner.title}</h3>
        {banner.subtitle && <p className={`mt-3 max-w-md text-sm leading-relaxed ${theme.text}`}>{banner.subtitle}</p>}
        <div className="mt-5">
          <ButtonLink href={banner.href} variant={theme.button} {...externalLinkProps(banner.href)}>
            {banner.ctaLabel}
            <ArrowRight className="size-4" aria-hidden="true" />
          </ButtonLink>
        </div>
      </div>
      {banner.image && (
        <div className="relative hidden aspect-square w-[38%] max-w-[220px] shrink-0 overflow-hidden rounded-[24px] bg-white/90 sm:block">
          <Image src={banner.image} alt="" fill sizes="220px" className="object-cover" />
        </div>
      )}
    </article>
  );
}

/** Bosh sahifadagi reklama bannerlari (admin paneldagi «Bosh sahifa» → «Bannerlar»). */
export function PromoBanners({ banners }: { banners: PromoBannerView[] }) {
  if (banners.length === 0) return null;
  return (
    <section aria-labelledby="promo-title" className="container-page pt-16 md:pt-24">
      <h2 id="promo-title" className="sr-only">
        Aksiyalar va takliflar
      </h2>
      <div className={`grid gap-4 md:gap-5 ${banners.length > 1 ? "md:grid-cols-2" : ""}`}>
        {banners.map((banner, index) => (
          // Toq sonli bo‘lsa, oxirgisi butun qatorni egallaydi — bo‘sh joy qolmaydi.
          <div key={banner.id} className={banners.length % 2 === 1 && index === banners.length - 1 && banners.length > 1 ? "md:col-span-2" : ""}>
            <PromoBanner banner={banner} />
          </div>
        ))}
      </div>
    </section>
  );
}
