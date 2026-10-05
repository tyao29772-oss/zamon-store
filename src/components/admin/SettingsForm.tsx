"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { AlertTriangle, ExternalLink, LoaderCircle, Plus, Save, X } from "lucide-react";
import { saveSettingsAction } from "@/app/admin/(panel)/sozlamalar/actions";
import { paragraphsToText, textToParagraphs, type StoreSettings } from "@/lib/settings/store-settings";
import { useToast } from "@/providers/ToastProvider";
import { LogoMark } from "@/components/brand/LogoMark";
import { FieldErrorsContext, inputClass, MoneyField, Section, TextAreaField, TextField } from "./product-form/fields";

interface FormState {
  name: string;
  wordmark: string;
  tagline: string;
  phone: string;
  telegramUsername: string;
  instagramUrl: string;
  address: string;
  landmark: string;
  workingHours: { label: string; hours: string }[];
  deliveryZones: { name: string; price: string; note: string }[];
  description: string;
  aboutLong: string;
  warrantyPolicy: string;
  returnPolicy: string;
  deliveryPolicy: string;
  privacyPolicy: string;
}

function toForm(s: StoreSettings): FormState {
  return {
    name: s.name,
    wordmark: s.wordmark,
    tagline: s.tagline,
    phone: s.phone,
    telegramUsername: s.telegramUsername,
    instagramUrl: s.instagramUrl,
    address: s.address,
    landmark: s.landmark ?? "",
    workingHours: s.workingHours.map((w) => ({ ...w })),
    deliveryZones: s.deliveryZones.map((z) => ({ name: z.name, price: String(z.price), note: z.note ?? "" })),
    description: s.description,
    aboutLong: paragraphsToText(s.aboutLong),
    warrantyPolicy: paragraphsToText(s.warrantyPolicy),
    returnPolicy: paragraphsToText(s.returnPolicy),
    deliveryPolicy: paragraphsToText(s.deliveryPolicy),
    privacyPolicy: paragraphsToText(s.privacyPolicy),
  };
}

function toPayload(f: FormState) {
  return {
    ...f,
    deliveryZones: f.deliveryZones.map((z) => ({ name: z.name, price: Number(z.price.replace(/[^\d]/g, "") || "0"), note: z.note })),
    aboutLong: textToParagraphs(f.aboutLong),
    warrantyPolicy: textToParagraphs(f.warrantyPolicy),
    returnPolicy: textToParagraphs(f.returnPolicy),
    deliveryPolicy: textToParagraphs(f.deliveryPolicy),
    privacyPolicy: textToParagraphs(f.privacyPolicy),
  };
}

const PARAGRAPH_HINT = "Har bir band orasida bitta bo‘sh qator qoldiring.";

export function SettingsForm({ initial, canSave }: { initial: StoreSettings; canSave: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState(() => toForm(initial));
  const [saved, setSaved] = useState(() => JSON.stringify(toForm(initial)));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const dirty = JSON.stringify(form) !== saved;

  // Maydon o‘zgarishi bilan uning (va ichidagi qatorlarning) eski xatosi yo‘qoladi.
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((prev) => {
      const next = Object.fromEntries(Object.entries(prev).filter(([path]) => path !== key && !path.startsWith(`${key}.`)));
      return Object.keys(next).length === Object.keys(prev).length ? prev : next;
    });
  };

  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const telegram = form.telegramUsername.trim().replace(/^@/, "");

  // Nom o‘zgartirilgan, lekin matnlarda eski nom qolgan bo‘lsa — qaysi joylarni yangilashni aytamiz.
  const oldName = initial.name.trim();
  const TEXT_FIELDS: [keyof FormState, string][] = [
    ["description", "Qisqa tavsif"],
    ["aboutLong", "Do‘kon haqida"],
    ["warrantyPolicy", "Kafolat"],
    ["returnPolicy", "Qaytarish"],
    ["deliveryPolicy", "Yetkazib berish"],
    ["privacyPolicy", "Maxfiylik"],
    ["tagline", "Shior"],
  ];
  const staleNameIn =
    oldName && form.name.trim() && form.name.trim().toLowerCase() !== oldName.toLowerCase()
      ? TEXT_FIELDS.filter(([key]) => String(form[key]).toLowerCase().includes(oldName.toLowerCase())).map(([, label]) => label)
      : [];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave || pending) return;
    setFormError(null);
    startTransition(async () => {
      try {
        const result = await saveSettingsAction(toPayload(form));
        if (!result.ok) {
          setErrors(result.fieldErrors ?? {});
          setFormError(result.error);
          requestAnimationFrame(() => {
            const target = formRef.current?.querySelector<HTMLElement>("[data-error-path]") ?? formRef.current;
            target?.scrollIntoView({ behavior: "smooth", block: "center" });
          });
          return;
        }
        setErrors({});
        setSaved(JSON.stringify(form));
        toast.show("Sozlamalar saqlandi — saytda yangilandi");
        router.refresh();
      } catch {
        setFormError("Server bilan aloqa uzildi. Qayta urinib ko‘ring.");
      }
    });
  };

  return (
    <FieldErrorsContext.Provider value={errors}>
      <form ref={formRef} onSubmit={submit} noValidate className="space-y-5">
        {/* Saqlash paneli tepada — pastki o‘ng burchakni Netlify belgisi to‘sadi */}
        <div className="sticky top-0 z-30 -mx-4 flex items-center gap-3 border-b border-line bg-page/95 px-4 py-2.5 backdrop-blur md:-mx-8 md:px-8">
          <p className={`min-w-0 flex-1 truncate text-xs ${dirty ? "font-medium text-warn" : "text-ink-muted"}`}>
            {pending ? "Saqlanmoqda…" : dirty ? "Saqlanmagan o‘zgarishlar bor" : "Hammasi saqlangan"}
          </p>
          <button
            type="submit"
            disabled={!canSave || !dirty || pending}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-white disabled:opacity-40"
          >
            {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
            Saqlash
          </button>
        </div>

        {!canSave && <p className="rounded-2xl bg-warn-soft p-4 text-sm text-warn">Baza (Supabase) ulanmagan — sozlamalarni saqlab bo‘lmaydi.</p>}
        {staleNameIn.length > 0 && (
          <p role="status" className="flex items-start gap-2 rounded-2xl border border-warn/30 bg-warn-soft p-4 text-sm text-warn">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>
              Nom «{form.name.trim()}» ga o‘zgardi, lekin bu matnlarda hali eski nom «{oldName}» qolgan: <b>{staleNameIn.join(", ")}</b>. Ularni
              pastdagi «Matnlar» bo‘limida yangilang — aks holda saytda eski nom ko‘rinadi.
            </span>
          </p>
        )}
        {formError && (
          <p role="alert" className="flex items-start gap-2 rounded-2xl border border-sale/30 bg-sale-soft p-4 text-sm text-sale">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> {formError}
          </p>
        )}

        <Section title="Do‘kon nomi va logotip" description="Saytning har bir sahifasida, Google'da va brauzer sarlavhasida ko‘rinadi.">
          <div className="grid gap-4 md:grid-cols-2">
            <TextField label="Do‘kon nomi" path="name" value={form.name} onChange={(v) => set("name", v)} required placeholder="Zamon Store" maxLength={40} />
            <TextField
              label="Logotip yozuvi (katta harflarda)"
              path="wordmark"
              value={form.wordmark}
              onChange={(v) => set("wordmark", v.toUpperCase())}
              required
              placeholder="ZAMON"
              hint="Qisqa bo‘lsin (12 belgigacha). Belgidagi harf — birinchi harf."
              maxLength={12}
            />
            <TextField
              label="Shior"
              path="tagline"
              value={form.tagline}
              onChange={(v) => set("tagline", v)}
              required
              placeholder="Telefon, noutbuk va aksessuarlar — Toshkentda"
              maxLength={80}
              className="md:col-span-2"
            />
          </div>
          {/* Jonli ko‘rinish — saqlashdan oldin logotip qanday chiqishini ko‘rsatadi */}
          <div className="mt-4 flex flex-wrap items-center gap-6 rounded-2xl bg-page-2/70 p-4" aria-label="Logotip ko‘rinishi">
            <span className="flex items-center gap-2.5">
              <LogoMark size={40} letter={form.wordmark || "Z"} />
              <span className="flex flex-col leading-none">
                <span className={`font-bold text-ink ${form.wordmark.length > 7 ? "text-[15px] tracking-[0.08em]" : "text-[19px] tracking-[0.16em]"}`}>{form.wordmark || "—"}</span>
                <span className="mt-1 text-[9px] font-medium uppercase tracking-[0.34em] text-ink-muted">store</span>
              </span>
            </span>
            <span className="min-w-0 text-xs text-ink-muted">
              Brauzer sarlavhasi: <b className="text-ink">{form.name || "…"} — {form.tagline || "…"}</b>
            </span>
          </div>
        </Section>

        <Section title="Aloqa" description="Saytdagi «Telegram orqali buyurtma» tugmasi, footer va «Aloqa» sahifasida ko‘rinadi.">
          <div className="grid gap-4 md:grid-cols-2">
            <TextField
              label="Telegram username (xaridorlar yozadigan akkaunt)"
              path="telegramUsername"
              value={form.telegramUsername}
              onChange={(v) => set("telegramUsername", v)}
              required
              placeholder="zamon_store"
              hint={
                telegram ? (
                  <a href={`https://t.me/${telegram}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-accent-ink hover:underline">
                    t.me/{telegram} — ochib tekshiring <ExternalLink className="size-3" aria-hidden="true" />
                  </a>
                ) : (
                  "Bot emas — oddiy Telegram akkaunt yoki do‘kon akkaunti"
                )
              }
              maxLength={60}
            />
            <TextField label="Telefon" path="phone" value={form.phone} onChange={(v) => set("phone", v)} required placeholder="+998 90 123 45 67" inputMode="text" maxLength={30} />
            <TextField
              label="Instagram (ixtiyoriy)"
              path="instagramUrl"
              value={form.instagramUrl}
              onChange={(v) => set("instagramUrl", v)}
              placeholder="https://instagram.com/zamon.store"
              hint="Bo‘sh qoldirsangiz, saytda ko‘rsatilmaydi."
              maxLength={200}
              className="md:col-span-2"
            />
          </div>
        </Section>

        <Section title="Manzil">
          <div className="grid gap-4 md:grid-cols-2">
            <TextField label="Manzil" path="address" value={form.address} onChange={(v) => set("address", v)} required placeholder="Toshkent sh., Chilonzor tumani, ..." maxLength={300} className="md:col-span-2" />
            <TextField label="Mo‘ljal (ixtiyoriy)" path="landmark" value={form.landmark} onChange={(v) => set("landmark", v)} placeholder="Metro «Chilonzor» yaqinida" maxLength={200} className="md:col-span-2" />
          </div>
          <p className="mt-3 text-xs text-ink-muted">Xarita tugmasi manzil bo‘yicha Google Maps’ni ochadi.</p>
        </Section>

        <Section title="Ish vaqti">
          <ul className="space-y-2">
            {form.workingHours.map((row, i) => (
              <li key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2" data-error-path={errors[`workingHours.${i}.label`] || errors[`workingHours.${i}.hours`] ? `workingHours.${i}` : undefined}>
                <input
                  value={row.label}
                  onChange={(e) => set("workingHours", form.workingHours.map((w, k) => (k === i ? { ...w, label: e.target.value } : w)))}
                  placeholder="Dushanba – Shanba"
                  aria-label="Kunlar"
                  maxLength={60}
                  className={`${inputClass} ${errors[`workingHours.${i}.label`] ? "border-sale" : "border-line"}`}
                />
                <input
                  value={row.hours}
                  onChange={(e) => set("workingHours", form.workingHours.map((w, k) => (k === i ? { ...w, hours: e.target.value } : w)))}
                  placeholder="09:00 – 20:00"
                  aria-label="Soatlar"
                  maxLength={60}
                  className={`${inputClass} ${errors[`workingHours.${i}.hours`] ? "border-sale" : "border-line"}`}
                />
                <button type="button" onClick={() => set("workingHours", form.workingHours.filter((_, k) => k !== i))} disabled={form.workingHours.length <= 1} className="rounded-lg p-2.5 text-ink-muted hover:bg-page-2 disabled:opacity-30" title="O‘chirish">
                  <X className="size-4" aria-hidden="true" />
                  <span className="sr-only">Qatorni o‘chirish</span>
                </button>
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => set("workingHours", [...form.workingHours, { label: "", hours: "" }])} disabled={form.workingHours.length >= 10} className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-accent-ink hover:underline disabled:opacity-40">
            <Plus className="size-3.5" aria-hidden="true" /> Qator qo‘shish
          </button>
        </Section>

        <Section title="Yetkazib berish narxlari" description="«Yetkazib berish» sahifasidagi jadval.">
          <ul className="space-y-3">
            {form.deliveryZones.map((zone, i) => (
              <li key={i} className="grid gap-2 rounded-2xl border border-line bg-white/70 p-3 sm:grid-cols-[1.2fr_1fr_1.4fr_auto] sm:items-end">
                <TextField label="Hudud" path={`deliveryZones.${i}.name`} value={zone.name} onChange={(v) => set("deliveryZones", form.deliveryZones.map((z, k) => (k === i ? { ...z, name: v } : z)))} placeholder="Toshkent shahri" maxLength={80} />
                <MoneyField label="Narx (0 — bepul)" path={`deliveryZones.${i}.price`} value={zone.price} onChange={(v) => set("deliveryZones", form.deliveryZones.map((z, k) => (k === i ? { ...z, price: v } : z)))} placeholder="30 000" />
                <TextField label="Izoh (ixtiyoriy)" path={`deliveryZones.${i}.note`} value={zone.note} onChange={(v) => set("deliveryZones", form.deliveryZones.map((z, k) => (k === i ? { ...z, note: v } : z)))} placeholder="1–3 kun ichida" maxLength={150} />
                <button type="button" onClick={() => set("deliveryZones", form.deliveryZones.filter((_, k) => k !== i))} className="justify-self-end rounded-lg p-2.5 text-ink-muted hover:bg-sale-soft hover:text-sale" title="O‘chirish">
                  <X className="size-4" aria-hidden="true" />
                  <span className="sr-only">Hududni o‘chirish</span>
                </button>
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => set("deliveryZones", [...form.deliveryZones, { name: "", price: "", note: "" }])} disabled={form.deliveryZones.length >= 20} className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-accent-ink hover:underline disabled:opacity-40">
            <Plus className="size-3.5" aria-hidden="true" /> Hudud qo‘shish
          </button>
        </Section>

        <Section title="Matnlar" description="«Magazin haqida», «Kafolat», «Yetkazib berish», «Maxfiylik» sahifalari va footer.">
          <div className="space-y-4">
            <TextAreaField label="Qisqa tavsif (footer va Google uchun)" path="description" value={form.description} onChange={(v) => set("description", v)} rows={2} maxLength={400} />
            <TextAreaField label="Do‘kon haqida" path="aboutLong" value={form.aboutLong} onChange={(v) => set("aboutLong", v)} hint={PARAGRAPH_HINT} rows={6} maxLength={8000} />
            <TextAreaField label="Kafolat shartlari" path="warrantyPolicy" value={form.warrantyPolicy} onChange={(v) => set("warrantyPolicy", v)} hint={PARAGRAPH_HINT} rows={5} maxLength={8000} />
            <TextAreaField label="Qaytarish shartlari" path="returnPolicy" value={form.returnPolicy} onChange={(v) => set("returnPolicy", v)} hint={PARAGRAPH_HINT} rows={5} maxLength={8000} />
            <TextAreaField label="Yetkazib berish shartlari" path="deliveryPolicy" value={form.deliveryPolicy} onChange={(v) => set("deliveryPolicy", v)} hint={PARAGRAPH_HINT} rows={5} maxLength={8000} />
            <TextAreaField label="Maxfiylik siyosati" path="privacyPolicy" value={form.privacyPolicy} onChange={(v) => set("privacyPolicy", v)} hint={PARAGRAPH_HINT} rows={6} maxLength={8000} />
          </div>
        </Section>
      </form>
    </FieldErrorsContext.Provider>
  );
}
