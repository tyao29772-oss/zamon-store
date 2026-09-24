import Image from "next/image";
import { ProductArt } from "@/components/art/ProductArt";
import type { Product, ProductVariant } from "@/types";

interface ProductImageProps {
  product: Product;
  variant?: ProductVariant;
  sizes?: string;
  /** LCP rasm uchun. */
  eager?: boolean;
  className?: string;
}

/**
 * Mahsulot rasmi. `images[]` bo‘lsa haqiqiy foto (`next/image`), bo‘lmasa SVG illyustratsiya.
 * Fotoning oq foni iliq karta fonida yo‘qolishi uchun `mix-blend-multiply` ishlatiladi.
 */
export function ProductImage({ product, variant, sizes, eager, className }: ProductImageProps) {
  const photo = product.images[0];

  return (
    <div
      className={`relative flex aspect-square items-center justify-center overflow-hidden ${className ?? ""}`}
    >
      {photo ? (
        <Image
          src={photo}
          alt={product.name}
          fill
          sizes={sizes ?? "(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"}
          className="object-contain p-[6%] mix-blend-multiply"
          loading={eager ? "eager" : "lazy"}
          fetchPriority={eager ? "high" : "auto"}
        />
      ) : (
        <>
          <div
            aria-hidden="true"
            className="absolute bottom-[10%] h-[7%] w-[56%] rounded-[50%] bg-[#3a2a1a]/20 blur-lg"
          />
          <ProductArt
            product={product}
            variant={variant}
            className="relative h-[78%] w-[78%] drop-shadow-[0_14px_18px_rgba(60,40,20,0.22)]"
          />
          <span className="sr-only">{product.name}</span>
        </>
      )}
    </div>
  );
}
