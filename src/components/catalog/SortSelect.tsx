"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { SortKey } from "@/lib/catalog";

const OPTIONS: { value: SortKey; label: string }[] = [
  { value: "tavsiya", label: "Tavsiya etilgan" },
  { value: "arzon", label: "Arzonidan qimmatiga" },
  { value: "qimmat", label: "Qimmatidan arzoniga" },
  { value: "yangi", label: "Eng yangilari" },
  { value: "mashhur", label: "Eng ko‘p sotilganlar" },
  { value: "chegirma", label: "Chegirmadagilar" },
];

/** `defaultSort` — shu qiymat tanlanganda `saralash` parametri URL'dan olib tashlanadi. */
export function SortSelect({ value, defaultSort = "tavsiya" }: { value: SortKey; defaultSort?: SortKey }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <label className="inline-flex shrink-0 items-center gap-2 text-sm">
      <span className="hidden text-ink-muted sm:inline">Saralash:</span>
      <select
        value={value}
        onChange={(event) => {
          const next = new URLSearchParams(searchParams.toString());
          if (event.target.value === defaultSort) next.delete("saralash");
          else next.set("saralash", event.target.value);
          next.delete("sahifa");
          const qs = next.toString();
          router.push(qs ? `${pathname}?${qs}` : pathname);
        }}
        className="h-11 rounded-full border border-line bg-surface px-4 text-sm font-medium text-ink outline-none transition-colors focus-visible:border-ink"
      >
        {OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
