/**
 * Brauzerda rasmni yuklashdan oldin siqish: eng uzun tomoni 1600 px gacha, WebP (bo‘lmasa
 * JPEG). Telefon rasmi (3–12 MB) odatda 150–500 KB ga tushadi, sifat ko‘zga farq qilmaydi.
 * EXIF bo‘yicha burilish (telefonda yonboshlab olingan rasm) avtomatik to‘g‘rilanadi.
 */

export const MAX_SOURCE_BYTES = 25 * 1024 * 1024;
const MAX_SIDE = 1600;
/** Storage chegarasi 5 MB — xavfsiz zaxira bilan. */
const MAX_RESULT_BYTES = 4.5 * 1024 * 1024;
const QUALITIES = [0.85, 0.75, 0.65];

export class ImageProcessError extends Error {}

export interface CompressedImage {
  blob: Blob;
  type: "image/webp" | "image/jpeg";
  width: number;
  height: number;
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

async function decode(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new ImageProcessError("Bu rasmni ochib bo‘lmadi. JPG yoki PNG formatdagi rasm tanlang.");
  }
}

export async function compressImage(file: File): Promise<CompressedImage> {
  if (!file.type.startsWith("image/")) throw new ImageProcessError("Bu rasm emas. Faqat rasm (JPG, PNG, WebP) tanlang.");
  if (file.size > MAX_SOURCE_BYTES) throw new ImageProcessError("Rasm juda katta (25 MB dan oshiq).");

  const bitmap = await decode(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new ImageProcessError("Brauzer rasmni qayta ishlay olmadi.");
  // Shaffof PNG qora bo‘lib qolmasin (JPEG'da shaffoflik yo‘q).
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.imageSmoothingQuality = "high";
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  for (const quality of QUALITIES) {
    // Eski Safari WebP'ni qo‘llamaydi va PNG qaytaradi — unda JPEG ishlatamiz.
    let blob = await toBlob(canvas, "image/webp", quality);
    let type: CompressedImage["type"] = "image/webp";
    if (!blob || blob.type !== "image/webp") {
      blob = await toBlob(canvas, "image/jpeg", quality);
      type = "image/jpeg";
    }
    if (blob && blob.size <= MAX_RESULT_BYTES) return { blob, type, width, height };
  }
  throw new ImageProcessError("Rasmni yetarlicha siqib bo‘lmadi. Boshqa rasm tanlang.");
}
