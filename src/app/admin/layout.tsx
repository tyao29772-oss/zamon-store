import type { Metadata } from "next";
import { getStore } from "@/lib/repo/store";

export async function generateMetadata(): Promise<Metadata> {
  const { name } = await getStore();
  return {
    title: { default: `Admin panel | ${name}`, template: `%s | Admin · ${name}` },
    robots: { index: false, follow: false },
  };
}

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <div className="min-h-dvh bg-page">{children}</div>;
}
