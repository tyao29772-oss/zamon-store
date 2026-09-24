import { mkdir, appendFile, readFile } from "node:fs/promises";
import path from "node:path";

/**
 * `.data/*.jsonl` fayllariga yozish — MVP'da buyurtma va analytics saqlash shu yerda.
 * Keyin DB'ga o‘tganda faqat shu fayl almashtiriladi, chaqiruvchi kod o‘zgarmaydi.
 *
 * Serverless muhitda fayl tizimi yozib bo‘lmas (read-only) bo‘lishi mumkin — bunday holatda
 * xato ko‘tarilmaydi, faqat konsolga log yoziladi va sayt ishlashda davom etadi.
 */

const DATA_DIR = path.join(process.cwd(), ".data");

function filePath(name: string): string {
  return path.join(DATA_DIR, name);
}

export async function appendJsonLine(fileName: string, data: unknown): Promise<boolean> {
  try {
    await mkdir(DATA_DIR, { recursive: true });
    await appendFile(filePath(fileName), `${JSON.stringify(data)}\n`, "utf8");
    return true;
  } catch (error) {
    console.error(`[local-jsonl] "${fileName}" ga yozib bo‘lmadi:`, error);
    return false;
  }
}

/** Fayldagi (bo‘sh bo‘lmagan) qatorlar sonini qaytaradi; fayl yo‘q bo‘lsa 0. */
export async function countJsonLines(fileName: string): Promise<number> {
  try {
    const content = await readFile(filePath(fileName), "utf8");
    return content.split("\n").filter((line) => line.trim().length > 0).length;
  } catch {
    return 0;
  }
}
