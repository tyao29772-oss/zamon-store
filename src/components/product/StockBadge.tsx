import { STOCK_LABELS } from "@/lib/product";
import type { StockStatus } from "@/types";

const STOCK_STYLES: Record<StockStatus, string> = {
  in_stock: "bg-ok-soft text-ok",
  low: "bg-warn-soft text-warn",
  preorder: "bg-accent-soft text-accent-ink",
  out_of_stock: "bg-surface-muted text-ink-muted",
};

interface StockBadgeProps {
  status: StockStatus;
  className?: string;
}

/** Mavjud / Kam qoldi / Oldindan buyurtma / Tugagan — karta va mahsulot sahifasida umumiy. */
export function StockBadge({ status, className }: StockBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${STOCK_STYLES[status]} ${className ?? ""}`}
    >
      {STOCK_LABELS[status]}
    </span>
  );
}
