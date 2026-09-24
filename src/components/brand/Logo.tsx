import Link from "next/link";
import { siteConfig } from "@/config/site";

/** Logotip belgisi: qorong‘i yumaloq kvadrat ichida «Z» (yuqori va pastki chiziq krem, diagonal bronza). */
export function LogoMark({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <rect width="40" height="40" rx="12" fill="#1b1917" />
      <rect x="0.5" y="0.5" width="39" height="39" rx="11.5" fill="none" stroke="#ffffff" strokeOpacity="0.08" />
      <path d="M12 12.5h16" stroke="#f3ece3" strokeWidth="3.6" strokeLinecap="round" />
      <path d="M27.4 13.6 12.6 26.4" stroke="#c99a6b" strokeWidth="3.6" strokeLinecap="round" />
      <path d="M12 27.5h16" stroke="#f3ece3" strokeWidth="3.6" strokeLinecap="round" />
    </svg>
  );
}

interface LogoProps {
  /** `light` — qorong‘i fon ustida ishlatiladi. */
  tone?: "dark" | "light";
  className?: string;
}

export function Logo({ tone = "dark", className }: LogoProps) {
  const text = tone === "light" ? "text-white" : "text-ink";
  const sub = tone === "light" ? "text-white/60" : "text-ink-muted";

  return (
    <Link
      href="/"
      aria-label={`${siteConfig.name} — bosh sahifa`}
      className={`inline-flex items-center gap-2.5 ${className ?? ""}`}
    >
      <LogoMark size={40} />
      <span className="flex flex-col leading-none">
        <span className={`text-[19px] font-bold tracking-[0.16em] ${text}`}>{siteConfig.wordmark}</span>
        <span className={`mt-1 text-[9px] font-medium uppercase tracking-[0.34em] ${sub}`}>store</span>
      </span>
    </Link>
  );
}
