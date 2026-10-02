import type { Metadata } from "next";
import { CircleCheck, CircleDashed, type LucideIcon } from "lucide-react";
import { getServerEnv } from "@/config/env";
import { countOrders } from "@/lib/repo/orders";
import { getAllProducts } from "@/lib/repo/products";

export const metadata: Metadata = { title: "Dashboard" };

interface StatusRow {
  label: string;
  ok: boolean;
  text: string;
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
      <p className="text-sm text-ink-muted">{label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums text-ink">{value}</p>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const [products, orderCount] = await Promise.all([getAllProducts(), countOrders()]);
  const env = getServerEnv();

  const status: StatusRow[] = [
    {
      label: "Telegram bot",
      ok: env.telegramBotEnabled,
      text: env.telegramBotEnabled
        ? "Yangi buyurtmalar adminga yuboriladi"
        : "TELEGRAM_BOT_TOKEN / TELEGRAM_ADMIN_CHAT_ID to‘ldirilmagan",
    },
    {
      label: "Ma’lumotlar bazasi",
      ok: false,
      text: "Hozircha lokal fayllar (.data/). Supabase keyingi bosqichda ulanadi",
    },
  ];

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-semibold text-ink">Dashboard</h1>
      <p className="mt-1 text-sm text-ink-muted">Do‘kon holati bir qarashda.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <StatCard label="Saytdagi mahsulotlar" value={products.length.toLocaleString("uz-UZ")} />
        <StatCard label="Jami buyurtmalar" value={orderCount.toLocaleString("uz-UZ")} />
      </div>

      <section aria-labelledby="admin-status" className="mt-8">
        <h2 id="admin-status" className="text-lg font-semibold text-ink">
          Sozlamalar
        </h2>
        <ul className="mt-3 divide-y divide-line rounded-[var(--radius-card)] border border-line bg-surface">
          {status.map((row) => {
            const Icon: LucideIcon = row.ok ? CircleCheck : CircleDashed;
            return (
              <li key={row.label} className="flex items-start gap-3 p-4">
                <Icon
                  className={`mt-0.5 size-5 shrink-0 ${row.ok ? "text-ok" : "text-ink-muted"}`}
                  aria-hidden="true"
                />
                <div>
                  <p className="font-medium text-ink">{row.label}</p>
                  <p className="text-sm text-ink-muted">{row.text}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
