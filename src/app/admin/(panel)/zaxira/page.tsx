import type { Metadata } from "next";
import { connection } from "next/server";
import { DatabaseBackup, FileSpreadsheet, ShieldCheck, type LucideIcon } from "lucide-react";
import { requireAdmin } from "@/lib/admin/auth";
import { isDbConfigured } from "@/lib/db/supabase";
import { formatNumber } from "@/lib/format";
import { countOrders } from "@/lib/repo/orders";
import { getAllProductsForAdmin } from "@/lib/repo/products";

export const metadata: Metadata = { title: "Zaxira va eksport" };

function DownloadCard({ icon: Icon, title, text, href, button, disabled }: { icon: LucideIcon; title: string; text: React.ReactNode; href: string; button: string; disabled?: boolean }) {
  return (
    <section className="flex flex-col rounded-[var(--radius-card)] border border-line bg-surface p-5">
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-page-2 text-ink">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <h2 className="text-base font-semibold text-ink">{title}</h2>
      </div>
      <div className="mt-3 flex-1 text-sm text-ink-muted">{text}</div>
      {disabled ? (
        <span aria-disabled="true" className="mt-4 inline-flex h-11 cursor-not-allowed items-center justify-center rounded-full bg-ink/30 px-5 text-sm font-semibold text-white">
          {button}
        </span>
      ) : (
        <a href={href} download className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-ink px-5 text-sm font-semibold text-white hover:bg-black">
          {button}
        </a>
      )}
    </section>
  );
}

export default async function AdminBackupPage() {
  await connection();
  await requireAdmin();
  const [products, orderCount] = await Promise.all([getAllProductsForAdmin(), countOrders()]);
  const variantCount = products.reduce((sum, p) => sum + p.variants.length, 0);
  const db = isDbConfigured();

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-semibold text-ink">Zaxira va eksport</h1>
      <p className="mb-6 mt-1 text-sm text-ink-muted">Ma’lumotlarni kompyuteringizga yuklab oling: Excel’da ko‘rish uchun yoki ehtiyot nusxa sifatida.</p>

      <div className="grid gap-4 md:grid-cols-3">
        <DownloadCard
          icon={FileSpreadsheet}
          title="Mahsulotlar (Excel)"
          text={
            <>
              {formatNumber(products.length)} ta mahsulot, {formatNumber(variantCount)} ta variant. Har variant alohida qatorda: narx, eski narx, qoldiq, holat va saytdagi havola.
            </>
          }
          href="/admin/zaxira/mahsulotlar"
          button="Yuklab olish (.xlsx)"
        />
        <DownloadCard
          icon={FileSpreadsheet}
          title="Buyurtmalar (Excel)"
          text={
            <>
              {orderCount === null ? "Barcha" : `${formatNumber(orderCount)} ta`} buyurtma: sana, mijoz, telefon, mahsulot, narx, holat va izohlar. Excel’da filtr va jami summani hisoblash oson.
            </>
          }
          href="/admin/zaxira/buyurtmalar"
          button="Yuklab olish (.xlsx)"
        />
        <DownloadCard
          icon={DatabaseBackup}
          title="To‘liq zaxira (JSON)"
          text={
            db ? (
              <>Butun do‘kon bitta faylda: mahsulotlar, kategoriyalar, brendlar, sozlamalar, bosh sahifa va buyurtmalar. Biror narsa o‘chib ketsa, shu fayldan qayta tiklanadi.</>
            ) : (
              <>Baza (Supabase) ulanmagan — to‘liq zaxira faqat bazadan olinadi.</>
            )
          }
          href="/admin/zaxira/toliq"
          button="Zaxirani yuklab olish"
          disabled={!db}
        />
      </div>

      <section className="mt-6 rounded-[var(--radius-card)] border border-line bg-surface p-5 text-sm text-ink-muted">
        <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
          <ShieldCheck className="size-5 text-ok" aria-hidden="true" /> Maslahatlar
        </h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5">
          <li>
            <b className="text-ink">Haftada bir marta</b> to‘liq zaxirani yuklab, kompyuter yoki Google Drive’da saqlang. Katta o‘zgarishdan oldin ham bitta oling.
          </li>
          <li>
            Zaxira faylida <b className="text-ink">mijozlarning telefon raqamlari</b> bor — uni begonalarga bermang, ochiq joyga qo‘ymang.
          </li>
          <li>Mahsulot rasmlari Supabase’ning rasm papkasida qoladi; zaxirada ularning havolalari saqlanadi.</li>
          <li>
            Qayta tiklash (dasturchi uchun): <code className="rounded bg-page-2 px-1.5 py-0.5 text-xs text-ink">npm run db:restore -- fayl.json</code> — avval nima o‘zgarishini ko‘rsatadi,{" "}
            <code className="rounded bg-page-2 px-1.5 py-0.5 text-xs text-ink">--yes</code> bilan yozadi. Bazadagi yangiroq yozuvlar o‘chirilmaydi.
          </li>
        </ul>
      </section>
    </div>
  );
}
