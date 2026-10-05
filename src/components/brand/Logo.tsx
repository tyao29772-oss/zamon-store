import Link from "next/link";
import { getStore } from "@/lib/repo/store";
import { LogoMark } from "./LogoMark";

export { LogoMark };

interface LogoProps {
  /** `light` — qorong‘i fon ustida ishlatiladi. */
  tone?: "dark" | "light";
  className?: string;
}

/** Nom va logotip yozuvi admin «Sozlamalar»idan olinadi. */
export async function Logo({ tone = "dark", className }: LogoProps) {
  const store = await getStore();
  const text = tone === "light" ? "text-white" : "text-ink";
  const sub = tone === "light" ? "text-white/60" : "text-ink-muted";
  // Uzun yozuv telefon header'iga sig‘ishi uchun kichikroq va zichroq.
  const long = store.wordmark.length > 7;

  return (
    <Link href="/" aria-label={`${store.name} — bosh sahifa`} className={`inline-flex min-w-0 items-center gap-2.5 ${className ?? ""}`}>
      <LogoMark size={40} letter={store.wordmark} className="shrink-0" />
      <span className="flex min-w-0 flex-col leading-none">
        <span className={`truncate font-bold ${long ? "text-[15px] tracking-[0.08em]" : "text-[19px] tracking-[0.16em]"} ${text}`}>
          {store.wordmark}
        </span>
        <span className={`mt-1 text-[9px] font-medium uppercase tracking-[0.34em] ${sub}`}>store</span>
      </span>
    </Link>
  );
}
