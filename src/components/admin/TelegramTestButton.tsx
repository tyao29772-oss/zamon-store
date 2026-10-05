"use client";

import { useState, useTransition } from "react";
import { LoaderCircle, Send } from "lucide-react";
import { sendTestTelegramAction } from "@/app/admin/(panel)/telegram-actions";

export function TelegramTestButton() {
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <div className="mt-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            try {
              setResult(await sendTestTelegramAction());
            } catch {
              setResult({ ok: false, message: "Server bilan aloqa uzildi." });
            }
          })
        }
        className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink hover:border-ink/40 disabled:opacity-50"
      >
        {pending ? <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" /> : <Send className="size-3.5" aria-hidden="true" />}
        Sinov xabarini yuborish
      </button>
      {result && (
        <p role="status" className={`mt-1.5 text-xs ${result.ok ? "text-ok" : "text-sale"}`}>
          {result.message}
        </p>
      )}
    </div>
  );
}
