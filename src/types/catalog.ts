export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  description: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image?: string;
  parentId: string | null;
  sortOrder: number;
}

/** Repository qaytaradigan, yo‘li hisoblangan kategoriya. */
export interface ResolvedCategory extends Category {
  /** `telefonlar/iphone` */
  path: string;
  /** `/katalog/telefonlar/iphone` */
  href: string;
  depth: number;
  childIds: string[];
}

export interface CategoryNode extends ResolvedCategory {
  children: CategoryNode[];
}

export type BannerTheme = "dark" | "light" | "blue";

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  href: string;
  image?: string;
  theme: BannerTheme;
  sortOrder: number;
  active: boolean;
}
