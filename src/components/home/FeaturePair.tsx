import { ArrowRight } from "lucide-react";
import { ProductArt } from "@/components/art/ProductArt";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { formatPrice } from "@/lib/format";
import { getPriceInfo } from "@/lib/product";
import { productHref } from "@/lib/urls";
import type { Product } from "@/types";

interface FeatureProps {
  eyebrow: string;
  title: string;
  text: string;
  product: Product;
  tone: "sand" | "dark";
}

function Feature({ eyebrow, title, text, product, tone }: FeatureProps) {
  const dark = tone === "dark";
  const price = getPriceInfo(product);

  return (
    <article
      className={`grain relative isolate flex flex-col overflow-hidden rounded-[32px] p-7 md:p-10 ${
        dark ? "bg-dark text-white" : "bg-gradient-to-br from-[#e9dccb] to-[#d8c5ac] text-ink"
      }`}
    >
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -right-20 bottom-[-20%] size-[420px] rounded-full ${
          dark
            ? "bg-[radial-gradient(circle,rgba(255,244,230,0.22),transparent_68%)]"
            : "bg-[radial-gradient(circle,rgba(255,255,255,0.7),transparent_68%)]"
        }`}
      />
      <div className="relative max-w-[16rem]">
        <p
          className={`text-[11px] font-semibold uppercase tracking-[0.28em] ${
            dark ? "text-accent" : "text-accent-ink"
          }`}
        >
          {eyebrow}
        </p>
        <h3 className="mt-3 font-display text-4xl font-semibold leading-[1.02] tracking-tight md:text-[44px]">
          {title}
        </h3>
        <p className={`mt-3 text-sm leading-relaxed ${dark ? "text-white/65" : "text-ink/70"}`}>{text}</p>
        <p className="mt-4 text-lg font-bold tracking-tight">{formatPrice(price.price)}</p>
        <div className="mt-5">
          <ButtonLink href={productHref(product.slug)} variant={dark ? "light" : "dark"}>
            Batafsil
            <ArrowRight className="size-4" aria-hidden="true" />
          </ButtonLink>
        </div>
      </div>
      <div className="relative -mb-2 mt-4 flex justify-end md:absolute md:bottom-6 md:right-8 md:mt-0">
        <ProductArt
          product={product}
          className={`h-[190px] w-auto drop-shadow-[0_20px_26px_rgba(0,0,0,0.3)] md:h-[250px] ${
            product.categoryId.startsWith("laptoplar") ? "md:h-[220px]" : ""
          }`}
        />
      </div>
      <div className="hidden md:block md:h-[230px]" aria-hidden="true" />
    </article>
  );
}

export function FeaturePair({ laptop, earbuds }: { laptop: Product; earbuds: Product }) {
  return (
    <section aria-label="Tavsiya etilgan mahsulotlar" className="container-page pt-16 md:pt-24">
      <div className="grid gap-4 md:grid-cols-2 md:gap-5">
        <Feature
          eyebrow="Laptoplar"
          title="Kun bo‘yi ishlaydigan noutbuk"
          text={`${laptop.name}: yengil, sokin va tez. O‘qish va ish uchun.`}
          product={laptop}
          tone="sand"
        />
        <Feature
          eyebrow="Quloqchinlar"
          title="Shovqinsiz toza ovoz"
          text={`${earbuds.name}: faol shovqin bekor qilish va premium ovoz.`}
          product={earbuds}
          tone="dark"
        />
      </div>
    </section>
  );
}
