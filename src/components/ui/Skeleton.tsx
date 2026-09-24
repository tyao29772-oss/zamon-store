/** Yuklanish holati uchun bo‘sh blok. Ekran o‘qish dasturlaridan yashirin. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={`skeleton ${className ?? ""}`} />;
}
