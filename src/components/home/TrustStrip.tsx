import { BadgeCheck, MessageCircle, ShieldCheck, Truck } from "lucide-react";

const ITEMS = [
  { icon: BadgeCheck, title: "Original yoki tekshirilgan", text: "Har bir mahsulot sotuvdan oldin ko‘rikdan o‘tadi." },
  { icon: ShieldCheck, title: "Kafolat", text: "Yangi telefon va noutbuklarga 12 oygacha." },
  { icon: MessageCircle, title: "Tezkor javob", text: "Telegramda mavjudlik va narxni tasdiqlaymiz." },
  { icon: Truck, title: "Toshkent bo‘ylab yetkazish", text: "Buyurtma tasdiqlangach 2–4 soat ichida." },
];

export function TrustStrip() {
  return (
    <section aria-labelledby="trust-title" className="container-page pt-16 md:pt-24">
      <h2 id="trust-title" className="sr-only">
        Nega bizdan xarid qilish kerak
      </h2>
      <ul className="grid gap-6 rounded-[32px] border border-line bg-surface/70 p-6 sm:grid-cols-2 md:p-8 lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-line">
        {ITEMS.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex gap-4 lg:px-6 lg:first:pl-0 lg:last:pr-0">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-ink">
              <Icon className="size-5" strokeWidth={1.6} aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-ink">{title}</h3>
              <p className="mt-1 text-[13px] leading-snug text-ink-muted">{text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
