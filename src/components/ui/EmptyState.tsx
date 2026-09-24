import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  text?: string;
  /** Tugmalar / havolalar. */
  children?: ReactNode;
  className?: string;
}

/** Bo‘sh holat: sevimlilar bo‘sh, qidiruv natijasi yo‘q, sahifa topilmadi va h.k. */
export function EmptyState({ icon: Icon, title, text, children, className }: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center rounded-[32px] border border-line bg-surface/70 px-6 py-14 text-center ${className ?? ""}`}
    >
      <span className="flex size-16 items-center justify-center rounded-full bg-accent-soft text-accent-ink">
        <Icon className="size-7" strokeWidth={1.5} aria-hidden="true" />
      </span>
      <h2 className="mt-6 font-display text-3xl font-semibold tracking-tight md:text-4xl">{title}</h2>
      {text && <p className="mt-3 max-w-md text-[15px] leading-relaxed text-ink-muted">{text}</p>}
      {children && <div className="mt-8 flex flex-wrap justify-center gap-3">{children}</div>}
    </div>
  );
}
