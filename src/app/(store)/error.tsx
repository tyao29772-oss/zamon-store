"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { ButtonLink } from "@/components/ui/ButtonLink";

/** Kutilmagan xato: layout (header/footer) saqlanadi, faqat sahifa o‘rniga shu ko‘rinadi. */
export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    // Server jurnalidagi xato bilan solishtirish uchun `digest` ko‘rinadi.
    console.error(error);
  }, [error]);

  return (
    <main id="main" className="container-page pt-10 md:pt-16">
      <EmptyState
        icon={TriangleAlert}
        title="Nimadir noto‘g‘ri ketdi"
        text="Sahifani yuklashda xatolik yuz berdi. Iltimos, qayta urinib ko‘ring. Muammo davom etsa, Telegram orqali yozing."
      >
        <button
          type="button"
          onClick={() => retry()}
          className="inline-flex h-12 items-center justify-center rounded-full bg-ink px-6 text-sm font-semibold text-white transition-colors hover:bg-black"
        >
          Qayta urinish
        </button>
        <ButtonLink href="/" variant="outline">
          Bosh sahifaga
        </ButtonLink>
      </EmptyState>
      {error.digest && (
        <p className="mt-4 text-center text-xs text-ink-muted">Xato kodi: {error.digest}</p>
      )}
    </main>
  );
}
