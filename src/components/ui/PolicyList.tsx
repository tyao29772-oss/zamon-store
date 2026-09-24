/**
 * Kafolat/yetkazib berish/maxfiylik kabi siyosat sahifalarida ishlatiladigan raqamlangan
 * ro‘yxat — `TrustStrip`dagi ikonka-karta uslubini takrorlaydi, faqat ikonka o‘rniga tartib
 * raqami ko‘rsatiladi.
 */
export function PolicyList({ items }: { items: string[] }) {
  return (
    <ol className="space-y-3">
      {items.map((item, index) => (
        <li
          key={item}
          className="flex gap-4 rounded-2xl border border-line bg-surface/70 p-4 sm:p-5"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent-ink">
            {index + 1}
          </span>
          <p className="pt-0.5 text-[15px] leading-relaxed text-ink-muted">{item}</p>
        </li>
      ))}
    </ol>
  );
}
