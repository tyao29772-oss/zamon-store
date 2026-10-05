"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { AlertTriangle, ArrowDown, ArrowUp, ExternalLink, LoaderCircle, Plus, Save, Trash2 } from "lucide-react";
import { saveHomeSettingsAction } from "@/app/admin/(panel)/bosh-sahifa/actions";
import { PromoBanner } from "@/components/home/PromoBanners";
import { BANNER_THEMES, MAX_BANNERS, newBannerId, type HomeBanner, type HomeSettings } from "@/lib/settings/home-settings";
import { useToast } from "@/providers/ToastProvider";
import { BannerImageField } from "./BannerImageField";
import { Field, FieldErrorsContext, inputClass, Section, TextAreaField, TextField, Toggle } from "./product-form/fields";

export interface ProductChoice {
  slug: string;
  name: string;
  shortDescription: string;
  published: boolean;
}

const THEME_LABELS: Record<HomeBanner["theme"], { label: string; swatch: string }> = {
  dark: { label: "Qora", swatch: "bg-dark" },
  blue: { label: "Ko‘k", swatch: "bg-gradient-to-br from-[#16304a] to-[#2a5b86]" },
  light: { label: "Och", swatch: "bg-gradient-to-br from-[#f6efe6] to-[#e9dccb] border border-line" },
};

const LINK_HINT = "Sayt ichidagi sahifa (/aksiyalar, /katalog/telefonlar) yoki https:// havola";

function ProductSelect({ label, path, value, onChange, products }: { label: string; path: string; value: string; onChange: (slug: string) => void; products: ProductChoice[] }) {
  const known = products.some((p) => p.slug === value);
  return (
    <Field label={label} path={path} required hint={value ? <a href={`/mahsulot/${value}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-accent-ink hover:underline">Saytda ko‘rish <ExternalLink className="size-3" aria-hidden="true" /></a> : undefined}>
      {({ id, describedBy, borderClass }) => (
        <select id={id} aria-describedby={describedBy} value={value} onChange={(e) => onChange(e.target.value)} className={`${inputClass} ${borderClass}`}>
          {!known && <option value={value}>{value ? `${value} (topilmadi)` : "— tanlang —"}</option>}
          {products.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.name}
              {p.published ? "" : " (yashirin)"}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}

export function HomeSettingsForm({ initial, canSave, products }: { initial: HomeSettings; canSave: boolean; products: ProductChoice[] }) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState<HomeSettings>(initial);
  const [saved, setSaved] = useState(() => JSON.stringify(initial));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const dirty = JSON.stringify(form) !== saved;
  const busy = Object.values(uploading).some(Boolean);
  const productBySlug = new Map(products.map((p) => [p.slug, p]));

  /** O‘zgargan maydon (va ichidagilar)ning eski xatosi yo‘qoladi. */
  const clearErrors = (prefix: string) =>
    setErrors((prev) => {
      const next = Object.fromEntries(Object.entries(prev).filter(([path]) => path !== prefix && !path.startsWith(`${prefix}.`)));
      return Object.keys(next).length === Object.keys(prev).length ? prev : next;
    });

  const setHero = <K extends keyof HomeSettings["hero"]>(key: K, value: HomeSettings["hero"][K]) => {
    setForm((f) => ({ ...f, hero: { ...f.hero, [key]: value } }));
    clearErrors(`hero.${key}`);
  };
  const setFeature = <K extends keyof HomeSettings["features"][number]>(index: number, key: K, value: HomeSettings["features"][number][K]) => {
    setForm((f) => ({ ...f, features: f.features.map((x, i) => (i === index ? { ...x, [key]: value } : x)) }));
    clearErrors(`features.${index}.${key}`);
  };
  const setBanner = <K extends keyof HomeBanner>(id: string, key: K, value: HomeBanner[K]) => {
    setForm((f) => ({ ...f, banners: f.banners.map((b) => (b.id === id ? { ...b, [key]: value } : b)) }));
    const index = form.banners.findIndex((b) => b.id === id);
    clearErrors(`banners.${index}.${key}`);
  };
  // Tartib o‘zgarsa, banner xatolari indeksi chalkashadi — ularni tozalaymiz.
  const setBanners = (update: (list: HomeBanner[]) => HomeBanner[]) => {
    setForm((f) => ({ ...f, banners: update(f.banners) }));
    clearErrors("banners");
  };

  const onBusy = useCallback((id: string, value: boolean) => setUploading((u) => (u[id] === value ? u : { ...u, [id]: value })), []);

  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave || pending || busy) return;
    setFormError(null);
    startTransition(async () => {
      try {
        const result = await saveHomeSettingsAction(form);
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
        toast.show("Bosh sahifa saqlandi — saytda yangilandi");
        router.refresh();
      } catch {
        setFormError("Server bilan aloqa uzildi. Qayta urinib ko‘ring.");
      }
    });
  };

  const heroProduct = productBySlug.get(form.hero.productSlug);
  const activeCount = form.banners.filter((b) => b.active).length;

  return (
    <FieldErrorsContext.Provider value={errors}>
      <form ref={formRef} onSubmit={submit} noValidate className="space-y-5">
        {/* Saqlash paneli tepada — pastki o‘ng burchakni Netlify belgisi to‘sadi */}
        <div className="sticky top-0 z-30 -mx-4 flex items-center gap-3 border-b border-line bg-page/95 px-4 py-2.5 backdrop-blur md:-mx-8 md:px-8">
          <p className={`min-w-0 flex-1 truncate text-xs ${dirty ? "font-medium text-warn" : "text-ink-muted"}`}>
            {pending ? "Saqlanmoqda…" : busy ? "Rasm yuklanmoqda…" : dirty ? "Saqlanmagan o‘zgarishlar bor" : "Hammasi saqlangan"}
          </p>
          <a href="/" target="_blank" rel="noreferrer" className="hidden items-center gap-1 text-xs font-medium text-accent-ink hover:underline sm:inline-flex">
            Saytni ochish <ExternalLink className="size-3" aria-hidden="true" />
          </a>
          <button
            type="submit"
            disabled={!canSave || !dirty || pending || busy}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-white disabled:opacity-40"
          >
            {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
            Saqlash
          </button>
        </div>

        {!canSave && <p className="rounded-2xl bg-warn-soft p-4 text-sm text-warn">Baza (Supabase) ulanmagan — bosh sahifani saqlab bo‘lmaydi.</p>}
        {formError && (
          <p role="alert" className="flex items-start gap-2 rounded-2xl border border-sale/30 bg-sale-soft p-4 text-sm text-sale">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> {formError}
          </p>
        )}

        <Section title="Asosiy blok" description="Sahifaning eng tepasidagi katta qorong‘i blok: bitta mahsulot, narxi va ikki tugma.">
          <div className="grid gap-4 md:grid-cols-2">
            <ProductSelect label="Mahsulot" path="hero.productSlug" value={form.hero.productSlug} onChange={(v) => setHero("productSlug", v)} products={products} />
            <TextField label="Kichik yozuv" path="hero.eyebrow" value={form.hero.eyebrow} onChange={(v) => setHero("eyebrow", v)} placeholder="Haftaning tanlovi" maxLength={40} hint="Bo‘sh qoldirsangiz, ko‘rinmaydi" />
            <TextField
              label="Sarlavha"
              path="hero.title"
              value={form.hero.title}
              onChange={(v) => setHero("title", v)}
              placeholder={heroProduct?.name ?? "Mahsulot nomi"}
              maxLength={60}
              hint="Bo‘sh — mahsulot nomi chiqadi"
              className="md:col-span-2"
            />
            <TextAreaField
              label="Matn"
              path="hero.text"
              value={form.hero.text}
              onChange={(v) => setHero("text", v)}
              placeholder={heroProduct?.shortDescription ?? ""}
              maxLength={300}
              rows={2}
              hint="Bo‘sh — mahsulotning qisqa tavsifi chiqadi"
              className="md:col-span-2"
            />
            <TextField label="Ikkinchi tugma yozuvi" path="hero.secondaryLabel" value={form.hero.secondaryLabel} onChange={(v) => setHero("secondaryLabel", v)} placeholder="Barcha telefonlar" maxLength={30} hint="Bo‘sh — tugma chiqmaydi" />
            <TextField label="Ikkinchi tugma havolasi" path="hero.secondaryHref" value={form.hero.secondaryHref} onChange={(v) => setHero("secondaryHref", v)} placeholder="/katalog/telefonlar" maxLength={300} hint={LINK_HINT} />
          </div>
          <p className="mt-3 text-xs text-ink-muted">Birinchi tugma («Ko‘rish») har doim mahsulot sahifasiga olib boradi. Mahsulot keyinroq yashirilsa, sayt o‘zi boshqasini ko‘rsatadi.</p>
        </Section>

        <Section
          title="Reklama bannerlari"
          description={`Kategoriyalardan keyin chiqadi. ${activeCount} tasi yoqilgan, ko‘pi bilan ${MAX_BANNERS} ta.`}
          actions={
            <button
              type="button"
              disabled={form.banners.length >= MAX_BANNERS}
              onClick={() =>
                setBanners((list) => [...list, { id: newBannerId(), title: "", subtitle: "", ctaLabel: "Ko‘rish", href: "/aksiyalar", theme: "dark", image: "", active: true }])
              }
              className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-4 text-sm font-semibold text-white disabled:opacity-40"
            >
              <Plus className="size-4" aria-hidden="true" /> Banner qo‘shish
            </button>
          }
        >
          {form.banners.length === 0 && <p className="rounded-2xl bg-page-2/70 p-4 text-sm text-ink-muted">Banner yo‘q — bosh sahifada bu bo‘lim ko‘rinmaydi.</p>}
          <ol className="space-y-4">
            {form.banners.map((banner, index) => (
              <li key={banner.id} className={`rounded-2xl border p-3 sm:p-4 ${banner.active ? "border-line bg-white/60" : "border-dashed border-line bg-page-2/40"}`}>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <p className="flex-1 text-sm font-semibold text-ink">
                    {index + 1}-banner {!banner.active && <span className="font-normal text-ink-muted">· o‘chiq (saytda ko‘rinmaydi)</span>}
                  </p>
                  <button type="button" disabled={index === 0} onClick={() => setBanners((list) => swap(list, index, index - 1))} className="rounded-lg p-2 text-ink-muted hover:bg-page-2 disabled:opacity-30" title="Yuqoriga">
                    <ArrowUp className="size-4" aria-hidden="true" />
                    <span className="sr-only">{index + 1}-bannerni yuqoriga surish</span>
                  </button>
                  <button type="button" disabled={index === form.banners.length - 1} onClick={() => setBanners((list) => swap(list, index, index + 1))} className="rounded-lg p-2 text-ink-muted hover:bg-page-2 disabled:opacity-30" title="Pastga">
                    <ArrowDown className="size-4" aria-hidden="true" />
                    <span className="sr-only">{index + 1}-bannerni pastga surish</span>
                  </button>
                  <button type="button" onClick={() => setBanners((list) => list.filter((b) => b.id !== banner.id))} className="rounded-lg p-2 text-ink-muted hover:bg-sale-soft hover:text-sale" title="O‘chirish">
                    <Trash2 className="size-4" aria-hidden="true" />
                    <span className="sr-only">{index + 1}-bannerni o‘chirish</span>
                  </button>
                </div>
                <Toggle checked={banner.active} onChange={(v) => setBanner(banner.id, "active", v)} label="Saytda ko‘rsatish" />
                <div className="mt-2 grid gap-4 md:grid-cols-2">
                  <TextField label="Sarlavha" path={`banners.${index}.title`} value={banner.title} onChange={(v) => setBanner(banner.id, "title", v)} required placeholder="Kuz chegirmalari" maxLength={70} className="md:col-span-2" />
                  <TextAreaField label="Matn" path={`banners.${index}.subtitle`} value={banner.subtitle} onChange={(v) => setBanner(banner.id, "subtitle", v)} placeholder="Tanlangan telefonlarga chegirmalar." maxLength={200} rows={2} className="md:col-span-2" />
                  <TextField label="Tugma yozuvi" path={`banners.${index}.ctaLabel`} value={banner.ctaLabel} onChange={(v) => setBanner(banner.id, "ctaLabel", v)} required placeholder="Ko‘rish" maxLength={30} />
                  <TextField label="Tugma havolasi" path={`banners.${index}.href`} value={banner.href} onChange={(v) => setBanner(banner.id, "href", v)} required placeholder="/aksiyalar" maxLength={300} hint={LINK_HINT} />
                  <fieldset>
                    <legend className="mb-1.5 text-xs font-medium text-ink-muted">Rang</legend>
                    <div className="flex gap-2">
                      {BANNER_THEMES.map((theme) => (
                        <label key={theme} className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-sm ${banner.theme === theme ? "border-ink bg-white font-semibold text-ink" : "border-line text-ink-muted"}`}>
                          <input type="radio" name={`theme-${banner.id}`} value={theme} checked={banner.theme === theme} onChange={() => setBanner(banner.id, "theme", theme)} className="sr-only" />
                          <span className={`size-4 rounded-full ${THEME_LABELS[theme].swatch}`} aria-hidden="true" />
                          {THEME_LABELS[theme].label}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <BannerImageField
                    value={banner.image}
                    onChange={(url) => setBanner(banner.id, "image", url)}
                    canUpload={canSave}
                    path={`banners.${index}.image`}
                    onBusyChange={(v) => onBusy(banner.id, v)}
                  />
                </div>
                <div className={`mt-4 ${banner.active ? "" : "opacity-50"}`} aria-label={`${index + 1}-banner ko‘rinishi`}>
                  <p className="mb-1.5 text-xs font-medium text-ink-muted">Saytda shunday ko‘rinadi:</p>
                  <div className="pointer-events-none">
                    <PromoBanner banner={{ ...banner, title: banner.title || "Sarlavha", ctaLabel: banner.ctaLabel || "Ko‘rish", href: "/" }} />
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </Section>

        <Section title="Tavsiya kartalari" description="Mashhur mahsulotlardan keyin chiqadigan ikkita katta karta.">
          <Toggle checked={form.featuresEnabled} onChange={(v) => setForm((f) => ({ ...f, featuresEnabled: v }))} label="Saytda ko‘rsatish" />
          {form.featuresEnabled && (
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              {form.features.map((feature, index) => (
                <div key={index} className="space-y-3 rounded-2xl border border-line bg-white/60 p-3 sm:p-4">
                  <p className="text-sm font-semibold text-ink">{index + 1}-karta</p>
                  <ProductSelect label="Mahsulot" path={`features.${index}.productSlug`} value={feature.productSlug} onChange={(v) => setFeature(index, "productSlug", v)} products={products} />
                  <TextField label="Kichik yozuv" path={`features.${index}.eyebrow`} value={feature.eyebrow} onChange={(v) => setFeature(index, "eyebrow", v)} placeholder="Laptoplar" maxLength={30} />
                  <TextField label="Sarlavha" path={`features.${index}.title`} value={feature.title} onChange={(v) => setFeature(index, "title", v)} required placeholder="Kun bo‘yi ishlaydigan noutbuk" maxLength={50} />
                  <TextAreaField
                    label="Matn"
                    path={`features.${index}.text`}
                    value={feature.text}
                    onChange={(v) => setFeature(index, "text", v)}
                    placeholder={productBySlug.get(feature.productSlug)?.shortDescription ?? ""}
                    maxLength={200}
                    rows={2}
                    hint="Bo‘sh — mahsulotning qisqa tavsifi"
                  />
                  <fieldset>
                    <legend className="mb-1.5 text-xs font-medium text-ink-muted">Rang</legend>
                    <div className="flex gap-2">
                      {(["sand", "dark"] as const).map((tone) => (
                        <label key={tone} className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-sm ${feature.tone === tone ? "border-ink bg-white font-semibold text-ink" : "border-line text-ink-muted"}`}>
                          <input type="radio" name={`tone-${index}`} value={tone} checked={feature.tone === tone} onChange={() => setFeature(index, "tone", tone)} className="sr-only" />
                          <span className={`size-4 rounded-full ${tone === "dark" ? "bg-dark" : "bg-gradient-to-br from-[#e9dccb] to-[#d8c5ac]"}`} aria-hidden="true" />
                          {tone === "dark" ? "Qora" : "Qumrang"}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </div>
              ))}
            </div>
          )}
        </Section>
      </form>
    </FieldErrorsContext.Provider>
  );
}

function swap<T>(list: T[], a: number, b: number): T[] {
  if (b < 0 || b >= list.length) return list;
  const next = [...list];
  [next[a], next[b]] = [next[b]!, next[a]!];
  return next;
}
