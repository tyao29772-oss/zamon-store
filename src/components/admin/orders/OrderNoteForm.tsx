"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { LoaderCircle, Save } from "lucide-react";
import { updateOrderNoteAction } from "@/app/admin/(panel)/buyurtmalar/actions";
import { useToast } from "@/providers/ToastProvider";

/** Faqat admin ko‘radigan izoh: «ertaga 15:00 da olib ketadi», «oldindan 500 ming to‘ladi». */
export function OrderNoteForm({ orderId, initialNote, canEdit }: { orderId: string; initialNote: string; canEdit: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [note, setNote] = useState(initialNote);
  const [saved, setSaved] = useState(initialNote);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const dirty = note.trim() !== saved.trim();

  const save = () => {
    setError(null);
    startTransition(async () => {
      try {
        const result = await updateOrderNoteAction(orderId, note);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setSaved(note);
        toast.show("Izoh saqlandi");
        router.refresh();
      } catch {
        setError("Server bilan aloqa uzildi. Qayta urinib ko‘ring.");
      }
    });
  };

  return (
    <div>
      <label htmlFor={`note-${orderId}`} className="text-sm font-medium text-ink">
        Admin izohi <span className="font-normal text-ink-muted">(mijoz ko‘rmaydi)</span>
      </label>
      <textarea
        id={`note-${orderId}`}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
        maxLength={1000}
        disabled={!canEdit}
        placeholder="Masalan: ertaga 15:00 da do‘konga keladi, 500 ming oldindan to‘ladi"
        className="mt-1.5 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-accent disabled:bg-page-2"
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="text-xs tabular-nums text-ink-muted">{note.length}/1000</span>
        <button
          type="button"
          onClick={save}
          disabled={!canEdit || !dirty || pending}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-4 text-sm font-semibold text-white disabled:opacity-40"
        >
          {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
          Izohni saqlash
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-sale">
          {error}
        </p>
      )}
    </div>
  );
}
