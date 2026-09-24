import type { Category } from "@/types";

/**
 * Yagona kategoriya daraxti. Mahsulot faqat eng chuqur (leaf) kategoriyaga biriktiriladi;
 * ota kategoriya sahifasi barcha avlodlarini ko‘rsatadi.
 */
function category(
  id: string,
  parentId: string | null,
  slug: string,
  name: string,
  sortOrder: number,
  description: string,
): Category {
  return { id, parentId, slug, name, sortOrder, description };
}

export const categories: Category[] = [
  // Telefonlar
  category("telefonlar", null, "telefonlar", "Telefonlar", 1, "iPhone, Samsung, Xiaomi, Infinix, Honor va boshqa brendlarning smartfonlari."),
  category("telefonlar-iphone", "telefonlar", "iphone", "iPhone", 1, "Original Apple iPhone: yangi, open-box va tekshirilgan ishlatilgan telefonlar."),
  category("telefonlar-samsung", "telefonlar", "samsung", "Samsung", 2, "Samsung Galaxy S va A seriyalari."),
  category("telefonlar-infinix", "telefonlar", "infinix", "Infinix", 3, "Infinix Note, Hot va GT telefonlari."),
  category("telefonlar-honor", "telefonlar", "honor", "Honor", 4, "Honor 200, X seriyali telefonlar."),
  category("telefonlar-redmi-xiaomi", "telefonlar", "redmi-xiaomi", "Redmi / Xiaomi", 5, "Redmi Note, Redmi C va Xiaomi flagman telefonlari."),
  category("telefonlar-poco", "telefonlar", "poco", "Poco", 6, "Poco unumdor telefonlari."),
  category("telefonlar-boshqa", "telefonlar", "boshqa-telefonlar", "Boshqa telefonlar", 7, "Tecno va boshqa brendlarning telefonlari."),

  // Aksessuarlar
  category("aksessuarlar", null, "aksessuarlar", "Aksessuarlar", 2, "Chexol, himoya oynasi, zaryadchik, quloqchin, powerbank va boshqa aksessuarlar."),
  category("aksessuarlar-chexollar", "aksessuarlar", "chexollar", "Chexollar", 1, "iPhone, Samsung va Redmi uchun silikon, shaffof, MagSafe va mustahkam chexollar."),
  category("aksessuarlar-himoya-oynalari", "aksessuarlar", "himoya-oynalari", "Himoya oynalari", 2, "Ekran uchun toblangan himoya oynalari."),
  category("aksessuarlar-zaryadchiklar", "aksessuarlar", "zaryadchiklar", "Zaryadchiklar", 3, "Adapter, kabel, simsiz zaryadchik va avtomobil zaryadchiklari."),
  category("aksessuarlar-zaryadchiklar-adapterlar", "aksessuarlar-zaryadchiklar", "adapterlar", "Adapterlar", 1, "20W dan 65W gacha tezkor zaryadlash adapterlari."),
  category("aksessuarlar-zaryadchiklar-kabellar", "aksessuarlar-zaryadchiklar", "kabellar", "Kabellar", 2, "USB-C, Lightning va Micro USB kabellari."),
  category("aksessuarlar-zaryadchiklar-simsiz", "aksessuarlar-zaryadchiklar", "simsiz-zaryadchiklar", "Simsiz zaryadchiklar", 3, "MagSafe va boshqa simsiz zaryadlash qurilmalari."),
  category("aksessuarlar-zaryadchiklar-car", "aksessuarlar-zaryadchiklar", "car-chargerlar", "Car charger", 4, "Avtomobil uchun tezkor zaryadchiklar."),
  category("aksessuarlar-powerbanklar", "aksessuarlar", "powerbanklar", "Powerbanklar", 4, "10 000 va 20 000 mAh powerbanklar."),
  category("aksessuarlar-quloqchinlar", "aksessuarlar", "quloqchinlar", "Quloqchinlar", 5, "Simli quloqchinlar."),
  category("aksessuarlar-simsiz-quloqchinlar", "aksessuarlar", "simsiz-quloqchinlar", "Simsiz quloqchinlar", 6, "AirPods, Galaxy Buds va boshqa Bluetooth quloqchinlar."),
  category("aksessuarlar-smart-watch", "aksessuarlar", "smart-watch", "Smart watch", 7, "Apple Watch, Galaxy Watch va fitnes bilaguzuklar."),
  category("aksessuarlar-telefon-stendlari", "aksessuarlar", "telefon-stendlari", "Telefon stendlari", 8, "Stol va avtomobil uchun telefon stendlari."),
  category("aksessuarlar-boshqa", "aksessuarlar", "boshqa-aksessuarlar", "Boshqa aksessuarlar", 9, "Bluetooth kolonkalar va boshqa foydali aksessuarlar."),

  // Laptoplar
  category("laptoplar", null, "laptoplar", "Laptoplar", 3, "MacBook, HP, Lenovo, Asus, Acer va boshqa brendlarning noutbuklari."),
  category("laptoplar-macbook", "laptoplar", "macbook", "MacBook", 1, "Apple MacBook Air va MacBook Pro."),
  category("laptoplar-hp", "laptoplar", "hp", "HP", 2, "HP noutbuklari."),
  category("laptoplar-lenovo", "laptoplar", "lenovo", "Lenovo", 3, "Lenovo IdeaPad va boshqa noutbuklar."),
  category("laptoplar-asus", "laptoplar", "asus", "Asus", 4, "Asus VivoBook va boshqa noutbuklar."),
  category("laptoplar-acer", "laptoplar", "acer", "Acer", 5, "Acer Aspire va boshqa noutbuklar."),
  category("laptoplar-boshqa", "laptoplar", "boshqa-laptoplar", "Boshqa laptoplar", 6, "MSI va boshqa brendlarning noutbuklari."),
];
