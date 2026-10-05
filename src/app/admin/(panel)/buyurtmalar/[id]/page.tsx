import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ChevronLeft, ExternalLink, PackageCheck, Pencil } from "lucide-react";
import { ContactButtons } from "@/components/admin/orders/ContactButtons";
import { OrderNoteForm } from "@/components/admin/orders/OrderNoteForm";
import { OrderStatusControl } from "@/components/admin/orders/OrderStatusControl";
import { formatOrderTime, ORDER_STATUS_META } from "@/lib/admin/order-list";
import { isDbConfigured } from "@/lib/db/supabase";
import { formatPrice } from "@/lib/format";
import { formatUzPhone } from "@/lib/phone";
import { getOrderById } from "@/lib/repo/orders";
import { getProductForAdmin } from "@/lib/repo/products-admin";
import { productHref } from "@/lib/urls";
import { requireAdmin } from "@/lib/admin/auth";

export async function generateMetadata({ params }: PageProps<"/admin/buyurtmalar/[id]">): Promise<Metadata> {
  const { id } = await params;
  return { title: `Buyurtma #${id}` };
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3 py-2.5 text-sm sm:grid-cols-[160px_1fr]">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="min-w-0 text-ink">{children}</dd>
    </div>
  );
}

export default async function AdminOrderPage({ params }: PageProps<"/admin/buyurtmalar/[id]">) {
  await connection();
  // Layout ham tekshiradi, lekin sahifalar orasida yurganda layout qayta ishlamasligi mumkin — har sahifa o‘zi ham tekshiradi.
  await requireAdmin();
  const { id } = await params;
  const order = await getOrderById(decodeURIComponent(id));
  if (!order) notFound();
  const product = await getProductForAdmin(order.productId).catch(() => null);
  const canEdit = isDbConfigured();

  return (
    <div className="max-w-3xl">
      <Link href="/admin/buyurtmalar" className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
        <ChevronLeft className="size-4" aria-hidden="true" /> Buyurtmalar
      </Link>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold text-ink">Buyurtma #{order.id}</h1>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${ORDER_STATUS_META[order.status].badge}`}>{ORDER_STATUS_META[order.status].label}</span>
      </div>
      <p className="mt-1 text-sm text-ink-muted">{formatOrderTime(order.createdAt)} (Toshkent vaqti)</p>

      <section className="mt-6 rounded-[var(--radius-card)] border border-line bg-surface p-4 sm:p-6">
        <h2 className="text-base font-semibold text-ink">Holati</h2>
        <div className="mt-3">
          <OrderStatusControl orderId={order.id} status={order.status} stockDeducted={Boolean(order.stockDeducted)} canEdit={canEdit} />
        </div>
        {order.stockDeducted && (
          <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-ink-muted">
            <PackageCheck className="size-3.5" aria-hidden="true" /> Bu buyurtma uchun qoldiqdan 1 dona ayirilgan.
          </p>
        )}
      </section>

      <section className="mt-5 rounded-[var(--radius-card)] border border-line bg-surface p-4 sm:p-6">
        <h2 className="text-base font-semibold text-ink">Mijoz</h2>
        <dl className="mt-2 divide-y divide-line">
          <Row label="Ismi">{order.customerName}</Row>
          <Row label="Telefon">
            <span className="tabular-nums">{formatUzPhone(order.phone)}</span>
          </Row>
          <Row label="Mijoz izohi">{order.note ? `«${order.note}»` : <span className="text-ink-muted">—</span>}</Row>
        </dl>
        <div className="mt-4">
          <ContactButtons phone={order.phone} />
        </div>
      </section>

      <section className="mt-5 rounded-[var(--radius-card)] border border-line bg-surface p-4 sm:p-6">
        <h2 className="text-base font-semibold text-ink">Mahsulot</h2>
        <dl className="mt-2 divide-y divide-line">
          <Row label="Nomi">{order.productName}</Row>
          <Row label="Variant">{order.variantLabel}</Row>
          <Row label="Narx (buyurtma paytida)">
            <span className="font-semibold tabular-nums">{formatPrice(order.price)}</span>
          </Row>
          {product && (
            <Row label="Hozirgi qoldiq">
              {(() => {
                const variant = product.variants.find((v) => v.id === order.variantId);
                return variant ? `${variant.stock} dona` : <span className="text-ink-muted">variant o‘chirilgan</span>;
              })()}
            </Row>
          )}
        </dl>
        {product ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={`/admin/mahsulotlar/${product.id}`} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-ink hover:border-ink/40">
              <Pencil className="size-3.5" aria-hidden="true" /> Mahsulotni tahrirlash
            </Link>
            {product.isPublished && (
              <a href={productHref(product.slug, order.variantId)} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-ink hover:border-ink/40">
                <ExternalLink className="size-3.5" aria-hidden="true" /> Saytda ko‘rish
              </a>
            )}
          </div>
        ) : (
          <p className="mt-3 text-xs text-ink-muted">Mahsulot o‘chirilgan — buyurtmadagi nom va narx saqlanib qolgan.</p>
        )}
      </section>

      <section className="mt-5 rounded-[var(--radius-card)] border border-line bg-surface p-4 sm:p-6">
        <OrderNoteForm orderId={order.id} initialNote={order.adminNote ?? ""} canEdit={canEdit} />
      </section>
    </div>
  );
}
