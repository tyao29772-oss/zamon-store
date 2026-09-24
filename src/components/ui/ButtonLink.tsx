import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "dark" | "light" | "outline" | "outline-light";

const VARIANTS: Record<Variant, string> = {
  dark: "bg-ink text-white hover:bg-black",
  light: "bg-white text-ink hover:bg-[#f3ece3]",
  outline: "border border-ink/20 text-ink hover:border-ink/50 hover:bg-white/50",
  "outline-light": "border border-white/25 text-white hover:border-white/60 hover:bg-white/10",
};

interface ButtonLinkProps extends ComponentProps<typeof Link> {
  variant?: Variant;
}

/** Yumaloq (pill) tugma-havola. Min balandlik 48px — mobilda bosish qulay. */
export function ButtonLink({ variant = "dark", className, ...props }: ButtonLinkProps) {
  return (
    <Link
      {...props}
      className={`inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold transition-colors ${VARIANTS[variant]} ${className ?? ""}`}
    />
  );
}
