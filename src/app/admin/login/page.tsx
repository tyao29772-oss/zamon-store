import type { Metadata } from "next";
import { LockKeyhole } from "lucide-react";
import { LogoMark } from "@/components/brand/Logo";
import { LoginForm } from "@/components/admin/LoginForm";
import { getAdminEnv } from "@/config/env";
import { siteConfig } from "@/config/site";
import { safeAdminRedirect } from "@/lib/admin/session";

export const metadata: Metadata = { title: "Kirish" };

export default async function AdminLoginPage({ searchParams }: PageProps<"/admin/login">) {
  const { next } = await searchParams;
  const { enabled } = getAdminEnv();

  return (
    <main id="main" className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-sm rounded-[var(--radius-card)] border border-line bg-surface p-7 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-3">
          <LogoMark size={44} />
          <div>
            <h1 className="text-lg font-semibold text-ink">Admin panel</h1>
            <p className="text-sm text-ink-muted">{siteConfig.name}</p>
          </div>
        </div>

        {enabled ? (
          <LoginForm next={safeAdminRedirect(next)} />
        ) : (
          <div className="mt-6 rounded-2xl bg-warn-soft p-4 text-sm leading-relaxed text-warn">
            <p className="flex items-center gap-2 font-semibold">
              <LockKeyhole className="size-4" aria-hidden="true" />
              Admin panel hali sozlanmagan
            </p>
            <p className="mt-2 text-ink">
              Server muhitiga kamida 12 belgili <code className="font-mono">ADMIN_PASSWORD</code> va kamida 32 belgili{" "}
              <code className="font-mono">ADMIN_SESSION_SECRET</code> qo‘shing, so‘ng serverni qayta ishga
              tushiring.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
