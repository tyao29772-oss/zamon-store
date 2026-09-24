/**
 * Qaysi mahsulotlarga foto qo‘yilganini va qaysilari yetishmayotganini ko‘rsatadi.
 * Ishga tushirish: `npm run images`
 */
import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { allProducts } from "@/data/products";
import { getProductBySlug } from "@/lib/repo/products";

async function main(): Promise<void> {
  const withPhoto: string[] = [];
  const withoutPhoto: string[] = [];
  const withHero: string[] = [];

  for (const { slug } of allProducts) {
    const product = await getProductBySlug(slug);
    if (product && product.images.length > 0) withPhoto.push(slug);
    else withoutPhoto.push(slug);
    if (product?.heroImage) withHero.push(slug);
  }

  console.log(`Jami mahsulot: ${allProducts.length}`);
  console.log(`Foto bor: ${withPhoto.length}`);
  console.log(`Foto yo‘q (illyustratsiya ko‘rinadi): ${withoutPhoto.length}`);
  console.log(`Bosh sahifa uchun hero rasm bor: ${withHero.length}`);

  if (withoutPhoto.length > 0) {
    console.log("\nFoto kerak bo‘lgan papkalar (public/products/ ichida shu nom bilan yarating):");
    for (const slug of withoutPhoto) console.log(`  ${slug}`);
  }

  const productsDir = join(process.cwd(), "public", "products");
  if (existsSync(productsDir)) {
    const known = new Set(allProducts.map((p) => p.slug));
    const unknown = readdirSync(productsDir).filter(
      (name) => statSync(join(productsDir, name)).isDirectory() && !known.has(name),
    );
    if (unknown.length > 0) {
      console.log("\nOGOHLANTIRISH: bu papkalar hech qaysi mahsulotga mos kelmaydi (nomida xato bo‘lishi mumkin):");
      for (const name of unknown) console.log(`  ${name}`);
      process.exitCode = 1;
    }
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
