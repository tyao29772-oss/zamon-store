"use client";

import { useActionState } from "react";
import { LoaderCircle } from "lucide-react";
import { loginAction, type LoginState } from "@/app/admin/actions";

const initialState: LoginState = { error: null };

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="mt-7 space-y-4" noValidate>
      <input type="hidden" name="next" value={next} />
      <div>
        <label htmlFor="admin-password" className="text-sm font-medium text-ink">
          Parol
        </label>
        <input
          id="admin-password"
          name="password"
          type="password"
          required
          autoFocus
          autoComplete="current-password"
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? "admin-login-error" : undefined}
          className="mt-1.5 h-12 w-full rounded-2xl border border-line bg-white px-4 text-ink outline-none transition-colors focus:border-accent"
        />
      </div>

      {state.error && (
        <p id="admin-login-error" role="alert" className="rounded-xl bg-sale-soft px-3 py-2 text-sm text-sale">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink text-sm font-semibold text-white transition-colors hover:bg-black disabled:opacity-60"
      >
        {pending && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
        Kirish
      </button>
    </form>
  );
}
