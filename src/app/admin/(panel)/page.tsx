import type { Metadata } from "next";
import { connection } from "next/server";
import Link from "next/link";
import { TelegramTestButton } from "@/components/admin/TelegramTestButton";
import { CircleAlert, CircleCheck, CircleDashed, type LucideIcon } from "lucide-react";
import { getServerEnv } from "@/config/env";
import { checkImageBucket } from "@/lib/db/storage";
import { checkDbHealth } from "@/lib/db/supabase";
import { countNewOrders, countOrders } from "@/lib/repo/orders";
import { countByStatus, toAdminRow } from "@/lib/admin/product-list";
import { formatNumber } from "@/lib/format";
import { getAllProductsForAdmin } from "@/lib/repo/products";
import { requireAdmin } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "Dashboard" };

interface StatusRow {
  label: string;
  ok: boolean;
  /** Sozlangan, lekin ishlamayapti — qizil belgi. */
  error?: boolean;
  text: string;
  /** Qator ostidagi qo‘shimcha (masalan, sinov tugmasi). */
  extra?: React.ReactNode;
}

function StatCard({ label, value, href, tone }: { label: string; value: string; href?: string; tone?: "warn" | "sale" }) {
  const valueColor = tone === "warn" ? "text-warn" : tone === "sale" ? "text-sale" : "text-ink";
  const body = (
    <>
      <p className="text-sm text-ink-muted">{label}</p>
      <p className={`mt-2 text-3xl font-semibold tabular-nums ${valueColor}`}>{value}</p>
    </>
  );
  const box = "block rounded-[var(--radius-card)] border border-line bg-surface p-5";
  return href ? (
    <Link href={href} className={`${box} transition-colors hover:border-ink/30`}>
      {body}
    </Link>
  ) : (
    <div className={box}>{body}</div>
  );
}

export default async function AdminDashboardPage() {
  // Har doim so‘rov vaqtida yangi ma’lumot: build paytida bazaga murojaat qilinmaydi.
  await connection();
  // Layout ham tekshiradi, lekin sahifalar orasida yurganda layout qayta ishlamasligi mumkin — har sahifa o‘zi ham tekshiradi.
  await requireAdmin();
  const [products, orderCount, newOrders, db, imageBucket] = await Promise.all([
    getAllProductsForAdmin(),
    countOrders(),
    countNewOrders(),
    checkDbHealth(),
    checkImageBucket(),
  ]);
  const productCounts = countByStatus(products.map(toAdminRow));
  const env = getServerEnv();

  const dbText =
    db.state === "ok"
      ? "Supabase ulangan — buyurtmalar va statistika bazada saqlanadi"
      : db.state === "error"
        ? db.message
        : "Supabase sozlanmagan (SUPABASE_URL / SUPABASE_SECRET_KEY). Hozircha lokal fayllar (.data/) — Netlify'da saqlanmaydi";

  const status: StatusRow[] = [
    {
      label: "Telegram bot",
      ok: env.telegramBotEnabled,
      text: env.telegramBotEnabled
        ? "Yangi buyurtmalar Telegram'ingizga keladi"
        : "Sozlanmagan — yangi buyurtmalar Telegram'ga kelmaydi (TELEGRAM_BOT_TOKEN / TELEGRAM_ADMIN_CHAT_ID)",
      extra: env.telegramBotEnabled ? <TelegramTestButton /> : undefined,
    },
    {
      label: "Ma’lumotlar bazasi",
      ok: db.state === "ok",
      error: db.state === "error",
      text: dbText,
    },
    {
      label: "Rasmlar papkasi",
      ok: imageBucket,
      error: db.state === "ok" && !imageBucket,
      text: imageBucket
        ? "Admin paneldan rasm yuklash mumkin"
        : db.state === "ok"
          ? "Topilmadi — Supabase SQL Editor’da 0003_product_images.sql ni ishga tushiring"
          : "Supabase ulangandan keyin ishlaydi",
    },
  ];

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-semibold text-ink">Dashboard</h1>
      <p className="mt-1 text-sm text-ink-muted">Do‘kon holati bir qarashda.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Saytdagi mahsulotlar" value={formatNumber(productCounts.saytda)} href="/admin/mahsulotlar?holat=saytda" />
        <StatCard
          label={orderCount === null ? "Yangi buyurtmalar" : `Yangi buyurtmalar (jami ${formatNumber(orderCount)})`}
          value={formatNumber(newOrders)}
          href="/admin/buyurtmalar?holat=yangi"
          tone={newOrders > 0 ? "sale" : undefined}
        />
        <StatCard label="Kam qolgan" value={formatNumber(productCounts.kam)} href="/admin/mahsulotlar?holat=kam" tone={productCounts.kam > 0 ? "warn" : undefined} />
        <StatCard label="Tugagan" value={formatNumber(productCounts.tugagan)} href="/admin/mahsulotlar?holat=tugagan" tone={productCounts.tugagan > 0 ? "sale" : undefined} />
      </div>

      <section aria-labelledby="admin-status" className="mt-8">
        <h2 id="admin-status" className="text-lg font-semibold text-ink">
          Sozlamalar
        </h2>
        <ul className="mt-3 divide-y divide-line rounded-[var(--radius-card)] border border-line bg-surface">
          {status.map((row) => {
            const Icon: LucideIcon = row.ok ? CircleCheck : row.error ? CircleAlert : CircleDashed;
            const tone = row.ok ? "text-ok" : row.error ? "text-sale" : "text-ink-muted";
            return (
              <li key={row.label} className="flex items-start gap-3 p-4">
                <Icon
                  className={`mt-0.5 size-5 shrink-0 ${tone}`}
                  aria-hidden="true"
                />
                <div>
                  <p className="font-medium text-ink">{row.label}</p>
                  <p className="text-sm text-ink-muted">{row.text}</p>
                  {row.extra}
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
