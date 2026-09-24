import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  href?: string;
  linkLabel?: string;
  /** `h2` (default) yoki sahifa sarlavhasi bo‘lsa `h1`. */
  as?: "h1" | "h2";
}

export function SectionHeading({ eyebrow, title, href, linkLabel = "Hammasini ko‘rish", as: Tag = "h2" }: SectionHeadingProps) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-accent-ink">{eyebrow}</p>
        )}
        <Tag className="mt-2 font-display text-[34px] font-semibold leading-[1.05] tracking-tight text-ink md:text-5xl">
          {title}
        </Tag>
      </div>
      {href && (
        <Link
          href={href}
          className="group hidden shrink-0 items-center gap-1.5 pb-1 text-sm font-semibold text-ink sm:inline-flex"
        >
          {linkLabel}
          <ArrowRight
            className="size-4 transition-transform group-hover:translate-x-1"
            aria-hidden="true"
          />
        </Link>
      )}
    </div>
  );
}
