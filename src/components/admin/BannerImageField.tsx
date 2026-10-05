"use client";

import { useEffect, useRef, useState } from "react";
import { LoaderCircle, Paperclip, X } from "lucide-react";
import { createImageUploadAction } from "@/app/admin/(panel)/mahsulotlar/actions";
import { compressImage, ImageProcessError } from "@/lib/admin/compress-image";
import { putWithProgress } from "./product-form/ImagesEditor";
import { useFieldError } from "./product-form/fields";

interface BannerImageFieldProps {
  value: string;
  onChange: (url: string) => void;
  canUpload: boolean;
  /** Xato yo‘li, masalan `banners.0.image`. */
  path: string;
  onBusyChange: (busy: boolean) => void;
}

/** Banner uchun bitta ixtiyoriy rasm: 📎 bilan tanlanadi, siqiladi va yuklanadi. */
export function BannerImageField({ value, onChange, canUpload, path, onBusyChange }: BannerImageFieldProps) {
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const serverError = useFieldError(path);

  useEffect(() => onBusyChange(busy), [busy, onBusyChange]);

  const upload = async (file: File) => {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Faqat rasm fayli tanlang");
      return;
    }
    setBusy(true);
    setProgress(null);
    try {
      const compressed = await compressImage(file);
      const signed = await createImageUploadAction(compressed.type);
      if (!signed.ok) throw new ImageProcessError(signed.error);
      setProgress(0);
      await putWithProgress(signed.uploadUrl, compressed.blob, compressed.type, setProgress);
      onChange(signed.publicUrl);
    } catch (err) {
      setError(err instanceof ImageProcessError ? err.message : "Yuklab bo‘lmadi — internetni tekshiring");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  const message = error ?? serverError;

  return (
    <div data-error-path={serverError ? path : undefined}>
      <p className="mb-1.5 text-xs font-medium text-ink-muted">Rasm (ixtiyoriy)</p>
      <div className="flex items-center gap-3">
        {value ? (
          <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl border border-line bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element -- admin oldindan ko‘rish */}
            <img src={value} alt="Banner rasmi" className="size-full object-cover" />
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-white/95 text-ink shadow hover:bg-sale hover:text-white"
              title="Rasmni olib tashlash"
            >
              <X className="size-3.5" aria-hidden="true" />
              <span className="sr-only">Rasmni olib tashlash</span>
            </button>
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={!canUpload || busy}
          className="inline-flex h-11 items-center gap-2 rounded-full border border-ink/20 bg-white px-4 text-sm font-medium text-ink hover:border-ink/50 disabled:opacity-40"
        >
          {busy ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Paperclip className="size-4" aria-hidden="true" />}
          {busy ? (progress === null ? "Siqilmoqda…" : `${progress}%`) : value ? "Almashtirish" : "Rasm tanlash"}
        </button>
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void upload(file);
        }}
      />
      {message ? (
        <p className="mt-1 text-xs text-sale">{message}</p>
      ) : (
        <p className="mt-1 text-xs text-ink-muted">Kvadrat rasm yaxshi ko‘rinadi. Telefonda banner rasmsiz, faqat matn bilan chiqadi.</p>
      )}
    </div>
  );
}
