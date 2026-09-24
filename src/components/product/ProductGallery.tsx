"use client";

import Image from "next/image";
import { useRef, useState, type ReactNode } from "react";

interface ProductGalleryProps {
  images: string[];
  productName: string;
  /** Haqiqiy foto yo‘q bo‘lganda ko‘rsatiladigan illyustratsiya (variant rangiga mos). */
  art: ReactNode;
}

const FRAME_BG = "bg-[radial-gradient(circle_at_50%_38%,#fffaf3_0%,#efe3d4_70%,#e6d8c6_100%)]";

/** Rasm galereyasi: haqiqiy foto bo‘lsa thumbnail bilan (klaviaturada ←/→), bo‘lmasa — illyustratsiya. */
export function ProductGallery({ images, productName, art }: ProductGalleryProps) {
  const [active, setActive] = useState(0);
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const hasPhotos = images.length > 0;

  function moveTo(index: number) {
    const next = (index + images.length) % images.length;
    setActive(next);
    thumbRefs.current[next]?.focus();
  }

  return (
    <div>
      <div className={`relative aspect-square overflow-hidden rounded-[28px] ${FRAME_BG}`}>
        {hasPhotos ? (
          <Image
            src={images[active]!}
            alt={productName}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            priority
            className="object-contain p-6 mix-blend-multiply"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-10">
            <div aria-hidden="true" className="absolute bottom-[12%] h-[8%] w-[46%] rounded-[50%] bg-[#3a2a1a]/20 blur-lg" />
            <div className="relative h-full w-full drop-shadow-[0_16px_20px_rgba(60,40,20,0.22)]">{art}</div>
          </div>
        )}
      </div>

      {hasPhotos && images.length > 1 && (
        <div role="tablist" aria-label="Mahsulot rasmlari" className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((src, index) => (
            <button
              key={src}
              ref={(el) => {
                thumbRefs.current[index] = el;
              }}
              type="button"
              role="tab"
              aria-selected={index === active}
              tabIndex={index === active ? 0 : -1}
              onClick={() => setActive(index)}
              onKeyDown={(event) => {
                if (event.key === "ArrowRight") moveTo(active + 1);
                else if (event.key === "ArrowLeft") moveTo(active - 1);
              }}
              className={`relative size-16 shrink-0 overflow-hidden rounded-xl border-2 transition-colors ${FRAME_BG} ${
                index === active ? "border-ink" : "border-transparent hover:border-line"
              }`}
            >
              <Image src={src} alt="" fill sizes="64px" className="object-contain p-1.5 mix-blend-multiply" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
