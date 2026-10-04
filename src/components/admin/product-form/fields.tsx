"use client";

import { createContext, useContext, useId, type ReactNode } from "react";
import { formatNumber } from "@/lib/format";

/** Server qaytargan xatolar: `{"variants.2.price": "..."}`. */
export const FieldErrorsContext = createContext<Record<string, string>>({});

export function useFieldError(path: string): string | undefined {
  return useContext(FieldErrorsContext)[path];
}

export const inputClass =
  "h-11 w-full rounded-xl border bg-white px-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-muted/60 focus:border-accent disabled:bg-page-2 disabled:text-ink-muted";

function borderFor(error?: string): string {
  return error ? "border-sale" : "border-line";
}

interface FieldProps {
  label: string;
  /** Xato qidiriladigan yo‘l, masalan `name` yoki `variants.0.price`. */
  path?: string;
  hint?: ReactNode;
  required?: boolean;
  className?: string;
  children: (props: { id: string; error?: string; describedBy?: string; borderClass: string; required?: boolean }) => ReactNode;
}

/** Yorliq + input + yordamchi matn + xato. Xatoli maydon `data-error-path` bilan belgilanadi. */
export function Field({ label, path, hint, required, className, children }: FieldProps) {
  const id = useId();
  const error = useFieldError(path ?? "");
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className={className} data-error-path={error ? path : undefined}>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-ink-muted">
        {label}
        {required && (
          <span className="text-sale" aria-hidden="true">
            {" "}*
          </span>
        )}
      </label>
      {children({ id, error, describedBy, borderClass: borderFor(error), required })}
      {error ? (
        <p id={errorId} className="mt-1 text-xs text-sale">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="mt-1 text-xs text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

interface TextFieldProps {
  label: string;
  path: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: ReactNode;
  required?: boolean;
  maxLength?: number;
  className?: string;
  list?: string;
  disabled?: boolean;
  inputMode?: "text" | "numeric" | "decimal";
}

export function TextField({ label, path, value, onChange, hint, required, className, ...rest }: TextFieldProps) {
  return (
    <Field label={label} path={path} hint={hint} required={required} className={className}>
      {({ id, error, describedBy, borderClass, required: isRequired }) => (
        <input
          id={id}
          aria-required={isRequired || undefined}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`${inputClass} ${borderClass}`}
          {...rest}
        />
      )}
    </Field>
  );
}

interface TextAreaFieldProps {
  label: string;
  path: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: ReactNode;
  rows?: number;
  maxLength: number;
  className?: string;
}

export function TextAreaField({ label, path, value, onChange, hint, rows = 3, maxLength, placeholder, className }: TextAreaFieldProps) {
  return (
    <Field
      label={label}
      path={path}
      className={className}
      hint={
        <span className="flex justify-between gap-3">
          <span>{hint}</span>
          <span className="tabular-nums">
            {value.length}/{maxLength}
          </span>
        </span>
      }
    >
      {({ id, error, describedBy, borderClass }) => (
        <textarea
          id={id}
          value={value}
          rows={rows}
          maxLength={maxLength}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm leading-relaxed text-ink outline-none transition-colors placeholder:text-ink-muted/60 focus:border-accent ${borderClass}`}
        />
      )}
    </Field>
  );
}

interface MoneyFieldProps {
  label: string;
  path: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  className?: string;
}

/** Narx: faqat raqam saqlanadi, ko‘rinishi `14 500 000`. */
export function MoneyField({ label, path, value, onChange, required, placeholder, className }: MoneyFieldProps) {
  const digits = value.replace(/[^\d]/g, "");
  return (
    <Field label={label} path={path} required={required} className={className}>
      {({ id, error, describedBy, borderClass, required: isRequired }) => (
        <div className="relative">
          <input
            id={id}
            aria-required={isRequired || undefined}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={digits ? formatNumber(Number(digits)) : ""}
            onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, "").slice(0, 11))}
            placeholder={placeholder}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={`${inputClass} ${borderClass} pr-12 tabular-nums`}
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-muted">so‘m</span>
        </div>
      )}
    </Field>
  );
}

interface NumberFieldProps {
  label: string;
  path: string;
  value: string;
  onChange: (value: string) => void;
  min: number;
  max: number;
  suffix?: string;
  className?: string;
}

/** Butun son: − / + tugmalari bilan (telefonda klaviaturasiz o‘zgartirish oson). */
export function StepperField({ label, path, value, onChange, min, max, suffix, className }: NumberFieldProps) {
  const n = Number.parseInt(value, 10);
  const current = Number.isFinite(n) ? n : 0;
  const set = (next: number) => onChange(String(Math.min(max, Math.max(min, next))));
  return (
    <Field label={label} path={path} className={className}>
      {({ id, error, describedBy, borderClass }) => (
        <div className={`flex h-11 items-stretch overflow-hidden rounded-xl border bg-white ${borderClass}`}>
          <button
            type="button"
            onClick={() => set(current - 1)}
            disabled={current <= min}
            aria-label={`${label}ni kamaytirish`}
            className="w-10 shrink-0 text-lg text-ink-muted hover:bg-page-2 disabled:opacity-30"
          >
            −
          </button>
          <input
            id={id}
            type="text"
            inputMode="numeric"
            value={value}
            onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, "").slice(0, 6))}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className="min-w-0 flex-1 bg-transparent text-center text-sm tabular-nums text-ink outline-none"
          />
          {suffix && <span className="self-center pr-1 text-xs text-ink-muted">{suffix}</span>}
          <button
            type="button"
            onClick={() => set(current + 1)}
            disabled={current >= max}
            aria-label={`${label}ni oshirish`}
            className="w-10 shrink-0 text-lg text-ink-muted hover:bg-page-2 disabled:opacity-30"
          >
            +
          </button>
        </div>
      )}
    </Field>
  );
}

export function Section({ title, description, children, actions }: { title: string; description?: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="rounded-[var(--radius-card)] border border-line bg-surface p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-ink-muted">{description}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

export function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  const id = useId();
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start justify-between gap-4 py-2">
      <span>
        <span className="block text-sm font-medium text-ink">{label}</span>
        {description && <span className="block text-xs text-ink-muted">{description}</span>}
      </span>
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input id={id} type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
        <span className="h-6 w-11 rounded-full bg-line transition-colors peer-checked:bg-ok peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent-ink" />
        <span className="absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  );
}
