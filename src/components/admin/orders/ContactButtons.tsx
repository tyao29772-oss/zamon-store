import { Phone, Send } from "lucide-react";
import { phoneCallHref, telegramChatHref } from "@/lib/admin/order-list";

/** Mijoz bilan bir bosishda bog‘lanish: qo‘ng‘iroq va Telegram. */
export function ContactButtons({ phone, size = "md" }: { phone: string; size?: "sm" | "md" }) {
  const base = `inline-flex items-center gap-1.5 rounded-full font-semibold transition-colors ${size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"}`;
  return (
    <div className="flex flex-wrap gap-2">
      <a href={phoneCallHref(phone)} className={`${base} bg-ok text-white hover:opacity-90`}>
        <Phone className="size-3.5" aria-hidden="true" />
        Qo‘ng‘iroq
      </a>
      <a href={telegramChatHref(phone)} target="_blank" rel="noopener noreferrer" className={`${base} bg-[#229ED9] text-white hover:opacity-90`}>
        <Send className="size-3.5" aria-hidden="true" />
        Telegram
      </a>
    </div>
  );
}
