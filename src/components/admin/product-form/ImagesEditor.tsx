"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, ChevronLeft, ChevronRight, LoaderCircle, Paperclip, RotateCw, Star, X } from "lucide-react";
import { createImageUploadAction } from "@/app/admin/(panel)/mahsulotlar/actions";
import { compressImage, ImageProcessError } from "@/lib/admin/compress-image";
import { MAX_IMAGES } from "@/lib/admin/product-form";
import { Section, useFieldError } from "./fields";

interface PendingUpload {
  key: string;
  file: File;
  preview: string;
  /** 0–100; `null` — siqilmoqda. */
  progress: number | null;
  error?: string;
}

interface ImagesEditorProps {
  images: string[];
  /** Funksional yangilash — bir nechta rasm bir vaqtda tugasa ham hech biri yo‘qolmaydi. */
  onChange: (update: (images: string[]) => string[]) => void;
  canUpload: boolean;
  /** Yuklash davom etayotganini formaga bildiradi (saqlash tugmasi kutadi). */
  onBusyChange: (busy: boolean) => void;
}

/** Siqilgan rasmni imzolangan havolaga yuklaydi, foizini xabar qiladi. */
export function putWithProgress(url: string, blob: Blob, type: string, onProgress: (percent: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", type);
    // Fayl nomi noyob (uuid) va o‘zgarmaydi — brauzer bir yil keshlasa bo‘ladi.
    xhr.setRequestHeader("Cache-Control", "max-age=31536000");
    xhr.setRequestHeader("x-upsert", "false");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`HTTP ${xhr.status}`)));
    xhr.onerror = () => reject(new Error("network"));
    xhr.ontimeout = () => reject(new Error("timeout"));
    xhr.timeout = 120_000;
    xhr.send(blob);
  });
}

let uploadCounter = 0;

export function ImagesEditor({ images, onChange, canUpload, onBusyChange }: ImagesEditorProps) {
  const [pending, setPending] = useState<PendingUpload[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const imagesRef = useRef(images);
  const listError = useFieldError("images");

  const busy = pending.some((p) => !p.error);
  useEffect(() => onBusyChange(busy), [busy, onBusyChange]);

  // Sahifadan ketganda oldindan ko‘rish fayllari xotirada qolmasin.
  const pendingRef = useRef(pending);
  useEffect(() => () => pendingRef.current.forEach((p) => URL.revokeObjectURL(p.preview)), []);

  const patch = (key: string, change: Partial<PendingUpload>) =>
    setPending((list) => list.map((p) => (p.key === key ? { ...p, ...change } : p)));

  const drop = (key: string) =>
    setPending((list) => {
      const item = list.find((p) => p.key === key);
      if (item) URL.revokeObjectURL(item.preview);
      return list.filter((p) => p.key !== key);
    });

  const upload = async (item: PendingUpload) => {
    try {
      patch(item.key, { progress: null, error: undefined });
      const compressed = await compressImage(item.file);
      const signed = await createImageUploadAction(compressed.type);
      if (!signed.ok) throw new ImageProcessError(signed.error);
      patch(item.key, { progress: 0 });
      await putWithProgress(signed.uploadUrl, compressed.blob, compressed.type, (progress) => patch(item.key, { progress }));
      onChange((current) => (current.length < MAX_IMAGES && !current.includes(signed.publicUrl) ? [...current, signed.publicUrl] : current));
      drop(item.key);
    } catch (error) {
      patch(item.key, {
        error: error instanceof ImageProcessError ? error.message : "Yuklab bo‘lmadi — internetni tekshiring",
        progress: null,
      });
    }
  };

  /** Rasmlar navbat bilan (tanlangan tartibda) yuklanadi. */
  const enqueue = (item: PendingUpload) => {
    queue.current = queue.current.then(() => upload(item));
  };

  const addFiles = (files: File[]) => {
    setNotice(null);
    const imagesOnly = files.filter((f) => f.type.startsWith("image/"));
    if (imagesOnly.length < files.length) setNotice("Faqat rasm fayllari qo‘shildi (boshqa fayllar o‘tkazib yuborildi).");
    const room = MAX_IMAGES - imagesRef.current.length - pendingRef.current.filter((p) => !p.error).length;
    if (room <= 0) {
      setNotice(`Ko‘pi bilan ${MAX_IMAGES} ta rasm. Yangisini qo‘shish uchun bittasini o‘chiring.`);
      return;
    }
    if (imagesOnly.length > room) setNotice(`Ko‘pi bilan ${MAX_IMAGES} ta rasm — faqat dastlabki ${room} tasi qo‘shildi.`);
    const items = imagesOnly.slice(0, room).map((file) => {
      uploadCounter += 1;
      return { key: `u${uploadCounter}`, file, preview: URL.createObjectURL(file), progress: null } satisfies PendingUpload;
    });
    setPending((list) => [...list, ...items]);
    items.forEach(enqueue);
  };

  const addFilesRef = useRef(addFiles);
  // Hodisa ishlovchilari (paste, navbat) eng so‘nggi holatni ko‘rishi uchun — render tugagach yangilanadi.
  useEffect(() => {
    imagesRef.current = images;
    pendingRef.current = pending;
    addFilesRef.current = addFiles;
  });

  // Ctrl+V: nusxalangan rasm (Telegram, brauzer, skrinshot) formaning istalgan joyida joylanadi.
  useEffect(() => {
    if (!canUpload) return;
    const onPaste = (event: ClipboardEvent) => {
      const files = [...(event.clipboardData?.files ?? [])].filter((f) => f.type.startsWith("image/"));
      if (files.length === 0) return;
      event.preventDefault();
      addFilesRef.current(files);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [canUpload]);

  const move = (index: number, delta: number) =>
    onChange((current) => {
      const target = index + delta;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target]!, next[index]!];
      return next;
    });

  const makeMain = (index: number) => onChange((current) => [current[index]!, ...current.filter((_, i) => i !== index)]);
  const remove = (index: number) => onChange((current) => current.filter((_, i) => i !== index));

  const total = images.length + pending.filter((p) => !p.error).length;
  const full = total >= MAX_IMAGES;

  const onPicked = (event: React.ChangeEvent<HTMLInputElement>) => {
    addFiles([...(event.target.files ?? [])]);
    event.target.value = "";
  };

  const tileButton =
    "flex aspect-square flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <Section
      title="Rasmlar"
      description={`${images.length}/${MAX_IMAGES} · birinchisi — asosiy rasm (katalog va kartochkada ko‘rinadi)`}
    >
      <div
        data-error-path={listError ? "images" : undefined}
        onDragOver={(e) => {
          if (!canUpload || !e.dataTransfer.types.includes("Files")) return;
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          if (!canUpload) return;
          e.preventDefault();
          setDragging(false);
          addFiles([...e.dataTransfer.files]);
        }}
        className={`rounded-2xl transition-colors ${dragging ? "bg-accent-soft/60 outline-2 outline-dashed outline-accent" : ""}`}
      >
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
          {images.map((src, index) => (
            <li key={src} className="group relative aspect-square overflow-hidden rounded-2xl border border-line bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element -- admin oldindan ko‘rish */}
              <img src={src} alt={`${index + 1}-rasm`} className="size-full object-contain p-1" loading="lazy" />
              {index === 0 && (
                <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-ink/85 px-2 py-0.5 text-[10px] font-semibold text-white">
                  <Star className="size-3 fill-current" aria-hidden="true" /> Asosiy
                </span>
              )}
              <button
                type="button"
                onClick={() => remove(index)}
                className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-white/95 text-ink shadow hover:bg-sale hover:text-white"
                title="O‘chirish"
              >
                <X className="size-4" aria-hidden="true" />
                <span className="sr-only">{index + 1}-rasmni o‘chirish</span>
              </button>
              <div className="absolute inset-x-1.5 bottom-1.5 flex justify-between gap-1">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  className="grid size-7 place-items-center rounded-full bg-white/95 text-ink shadow disabled:invisible"
                  title="Chapga"
                >
                  <ChevronLeft className="size-4" aria-hidden="true" />
                  <span className="sr-only">{index + 1}-rasmni chapga surish</span>
                </button>
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => makeMain(index)}
                    className="grid size-7 place-items-center rounded-full bg-white/95 text-ink shadow hover:text-accent-ink"
                    title="Asosiy qilish"
                  >
                    <Star className="size-4" aria-hidden="true" />
                    <span className="sr-only">{index + 1}-rasmni asosiy qilish</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === images.length - 1}
                  className="grid size-7 place-items-center rounded-full bg-white/95 text-ink shadow disabled:invisible"
                  title="O‘ngga"
                >
                  <ChevronRight className="size-4" aria-hidden="true" />
                  <span className="sr-only">{index + 1}-rasmni o‘ngga surish</span>
                </button>
              </div>
            </li>
          ))}

          {pending.map((item) => (
            <li key={item.key} className="relative aspect-square overflow-hidden rounded-2xl border border-line bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element -- yuklanayotgan rasm oldindan ko‘rinishi */}
              <img src={item.preview} alt="" className={`size-full object-contain p-1 ${item.error ? "opacity-30" : "opacity-50"}`} />
              {item.error ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 p-2 text-center">
                  <p className="text-[11px] leading-tight text-sale">{item.error}</p>
                  <div className="flex gap-1.5">
                    <button type="button" onClick={() => enqueue(item)} className="inline-flex items-center gap-1 rounded-full bg-ink px-2.5 py-1 text-[11px] font-semibold text-white">
                      <RotateCw className="size-3" aria-hidden="true" /> Qayta
                    </button>
                    <button type="button" onClick={() => drop(item.key)} className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-ink shadow">
                      Bekor
                    </button>
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2" role="status">
                  <LoaderCircle className="size-6 animate-spin text-ink" aria-hidden="true" />
                  <span className="rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-ink">
                    {item.progress === null ? "Siqilmoqda…" : `${item.progress}%`}
                  </span>
                </div>
              )}
            </li>
          ))}

          {/* 📎 — Telegram'dagidek: telefonda Kamera/Galereya tanlovi chiqadi */}
          <li>
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={!canUpload || full}
              className={`${tileButton} size-full border-ink/25 text-ink hover:border-ink/60 hover:bg-white/70`}
            >
              <Paperclip className="size-6" aria-hidden="true" />
              Rasm qo‘shish
            </button>
          </li>
          <li className="md:hidden">
            <button
              type="button"
              onClick={() => cameraInput.current?.click()}
              disabled={!canUpload || full}
              className={`${tileButton} size-full border-ink/15 text-ink-muted hover:border-ink/40`}
            >
              <Camera className="size-6" aria-hidden="true" />
              Suratga olish
            </button>
          </li>
        </ul>
      </div>

      <input ref={fileInput} type="file" accept="image/*" multiple hidden onChange={onPicked} />
      <input ref={cameraInput} type="file" accept="image/*" capture="environment" hidden onChange={onPicked} />

      {(listError || notice) && (
        <p className={`mt-3 rounded-xl px-3 py-2 text-sm ${listError ? "bg-sale-soft text-sale" : "bg-warn-soft text-warn"}`}>{listError ?? notice}</p>
      )}
      <p className="mt-3 hidden text-xs text-ink-muted md:block">
        Maslahat: rasmni nusxalab (masalan, Telegram’dan) shu sahifada <kbd className="rounded border border-line bg-white px-1">Ctrl</kbd>+
        <kbd className="rounded border border-line bg-white px-1">V</kbd> bossangiz ham qo‘shiladi. Katta rasmlar avtomatik siqiladi.
      </p>
    </Section>
  );
}
