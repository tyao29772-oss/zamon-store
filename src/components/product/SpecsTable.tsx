import type { SpecGroup } from "@/types";

export function SpecsTable({ specs }: { specs: SpecGroup[] }) {
  if (specs.length === 0) return null;

  return (
    <div className="space-y-6">
      {specs.map((group) => (
        <div key={group.title}>
          <h3 className="text-sm font-semibold text-ink">{group.title}</h3>
          <dl className="mt-3 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface/60">
            {group.items.map((item) => (
              <div key={item.label} className="flex flex-col gap-0.5 px-4 py-3 sm:flex-row sm:gap-6 sm:py-2.5">
                <dt className="text-[13px] text-ink-muted sm:w-48 sm:shrink-0">{item.label}</dt>
                <dd className="text-[13px] font-medium text-ink">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}
