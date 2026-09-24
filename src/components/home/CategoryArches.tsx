import Link from "next/link";
import { Cable, Headphones, Smartphone, ShieldCheck, Zap, type LucideIcon } from "lucide-react";
import { AdapterArt, CableArt, CaseArt, EarbudsArt, StandArt } from "@/components/art/devices";
import { getCategoryById } from "@/lib/repo/categories";
import type { ReactNode } from "react";

interface ArchItem {
  categoryId: string;
  title: string;
  text: string;
  icon: LucideIcon;
  art: ReactNode;
}

const ITEMS: ArchItem[] = [
  {
    categoryId: "aksessuarlar-chexollar",
    title: "Chexollar",
    text: "Chiroyli dizayn. Ishonchli himoya.",
    icon: ShieldCheck,
    art: <CaseArt color="#e4cfb4" className="h-[86%] w-auto" />,
  },
  {
    categoryId: "aksessuarlar-zaryadchiklar-kabellar",
    title: "Kabellar",
    text: "Tez zaryad. Chigallashmaydi.",
    icon: Cable,
    art: <CableArt color="#d9c3a3" className="w-[92%]" />,
  },
  {
    categoryId: "aksessuarlar-zaryadchiklar-adapterlar",
    title: "Adapterlar",
    text: "Tezkor va xavfsiz zaryad.",
    icon: Zap,
    art: <AdapterArt color="#f6f1ea" className="h-[80%] w-auto" />,
  },
  {
    categoryId: "aksessuarlar-telefon-stendlari",
    title: "Stendlar",
    text: "Mustahkam ushlash. Qulay foydalanish.",
    icon: Smartphone,
    art: <StandArt color="#c8c4be" className="w-[88%]" />,
  },
  {
    categoryId: "aksessuarlar-simsiz-quloqchinlar",
    title: "Quloqchinlar",
    text: "Premium ovoz. Kun bo‘yi qulay.",
    icon: Headphones,
    art: <EarbudsArt color="#faf8f4" className="w-[92%]" />,
  },
];

/** Aksessuar kategoriyalari: kamar (arch) shaklidagi kartalar. */
export async function CategoryArches() {
  const categories = await Promise.all(ITEMS.map((item) => getCategoryById(item.categoryId)));

  return (
    <section aria-labelledby="arches-title" className="container-page pt-16 md:pt-24">
      <div className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-accent-ink">
          Har kungi qulaylik uchun
        </p>
        <h2
          id="arches-title"
          className="mx-auto mt-3 max-w-2xl font-display text-[36px] font-semibold leading-[1.05] tracking-tight md:text-[56px]"
        >
          Telefoningiz uchun kerakli hamma narsa
        </h2>
        <p className="mx-auto mt-4 max-w-md text-[15px] text-ink-muted">
          Uslub. Himoya. Qulaylik. Original aksessuarlar — kafolat bilan.
        </p>
      </div>

      <ul className="-mx-4 mt-10 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-4 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-5 md:gap-4 md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden">
        {ITEMS.map((item, index) => {
          const category = categories[index];
          if (!category) return null;
          const Icon = item.icon;

          return (
            <li key={item.categoryId} className="w-[210px] shrink-0 snap-start md:w-auto">
              <Link
                href={category.href}
                className="group flex h-full flex-col rounded-[28px] border border-line/80 bg-surface/60 p-3 text-center transition duration-300 hover:-translate-y-1 hover:bg-surface hover:shadow-card"
              >
                <div className="px-2 pb-4 pt-3">
                  <Icon className="mx-auto size-6 text-accent-ink" strokeWidth={1.5} aria-hidden="true" />
                  <h3 className="mt-3 text-[13px] font-semibold uppercase tracking-[0.16em] text-ink">
                    {item.title}
                  </h3>
                  <p className="mx-auto mt-1.5 max-w-[15ch] text-[13px] leading-snug text-ink-muted">
                    {item.text}
                  </p>
                </div>
                <div className="relative mt-auto flex h-[220px] items-center justify-center overflow-hidden rounded-t-[999px] rounded-b-[20px] bg-gradient-to-b from-[#ecdfcf] to-[#ddc9b0]">
                  <div
                    aria-hidden="true"
                    className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/50 to-transparent"
                  />
                  <div className="relative flex size-full items-center justify-center pt-6 drop-shadow-[0_12px_14px_rgba(80,55,30,0.25)] transition-transform duration-500 group-hover:scale-105">
                    {item.art}
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
