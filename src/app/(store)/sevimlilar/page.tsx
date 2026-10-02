import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { FavoritesView } from "@/components/favorites/FavoritesView";
import { SectionHeading } from "@/components/ui/SectionHeading";

export const metadata: Metadata = {
  title: "Sevimlilar",
  description: "Siz yoqtirgan mahsulotlar ro‘yxati.",
  robots: { index: false },
};

export default function FavoritesPage() {
  return (
    <main id="main" className="container-page pt-6 md:pt-10">
      <Breadcrumbs items={[{ label: "Bosh sahifa", href: "/" }, { label: "Sevimlilar" }]} />
      <div className="mt-4">
        <SectionHeading as="h1" eyebrow="Sizning tanlovingiz" title="Sevimlilar" />
      </div>
      <div className="mt-8">
        <FavoritesView />
      </div>
    </main>
  );
}
