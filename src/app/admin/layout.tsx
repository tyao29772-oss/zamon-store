import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: {
    default: `Admin panel | ${siteConfig.name}`,
    template: `%s | Admin · ${siteConfig.name}`,
  },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <div className="min-h-dvh bg-page">{children}</div>;
}
