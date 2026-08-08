import type { WeeklyAllocation } from "@/lib/weekly-allocation";
import { WEEKLY_COLORS, weeklyAllocationTotal } from "@/lib/weekly-allocation";

interface WeeklyAllocationFormProps {
  allocations: WeeklyAllocation[];
  onChange: (allocations: WeeklyAllocation[]) => void;
  onSubmit: () => void;
  submitting?: boolean;
}

const MAX_CUSTOM_CATEGORIES = 5;

function clampPercent(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function WeeklyAllocationForm({
  allocations,
  onChange,
  onSubmit,
  submitting = false,
}: WeeklyAllocationFormProps) {
  const total = weeklyAllocationTotal(allocations);
  const remaining = 100 - total;
  const customCount = allocations.filter((allocation) => allocation.custom).length;
  const labels = allocations.map((allocation) => allocation.label.trim().toLowerCase());
  const hasInvalidLabels = allocations.some(
    (allocation, index) =>
      !allocation.label.trim() || labels.indexOf(allocation.label.trim().toLowerCase()) !== index,
  );
  const canSubmit = total === 100 && !hasInvalidLabels && !submitting;

  const update = (id: string, patch: Partial<WeeklyAllocation>) => {
    onChange(
      allocations.map((allocation) =>
        allocation.id === id ? { ...allocation, ...patch } : allocation,
      ),
    );
  };

  const addCategory = () => {
    if (customCount >= MAX_CUSTOM_CATEGORIES) return;
    const colorIndex = allocations.length % WEEKLY_COLORS.length;
    onChange([
      ...allocations,
      {
        id: `weekly-custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        label: `Additional category ${customCount + 1}`,
        percent: 0,
        color: WEEKLY_COLORS[colorIndex],
        custom: true,
      },
    ]);
  };

  const removeCategory = (id: string) => {
    onChange(allocations.filter((allocation) => allocation.id !== id));
  };

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-border bg-card/70 p-5 md:p-6">
        <p className="text-xs uppercase tracking-[0.16em] text-accent">Exercise 1 · Typical week</p>
        <h2 className="mt-2 font-serif text-2xl text-foreground md:text-3xl">
          How do you spend a typical week?
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Divide 100% of your week across the categories below. Include the time you spend working,
          with people, doing hobbies, and the time that is simply for yourself. Add another category
          if something important is missing.
        </p>
        <p className="mt-3 rounded-xl bg-muted/60 px-4 py-3 text-xs text-foreground/75">
          Example: Work 60%, Family 20%, Close relationships 10%, Hobbies 5%, and Time for myself
          5%.
        </p>
      </section>

      <div className="space-y-3">
        {allocations.map((allocation) => (
          <div
            key={allocation.id}
            className="rounded-2xl border border-border bg-background/70 p-4"
          >
            <div className="flex items-center gap-3">
              <span
                className="h-4 w-4 shrink-0 rounded-full"
                style={{ backgroundColor: allocation.color }}
              />
              {allocation.custom ? (
                <input
                  type="text"
                  value={allocation.label}
                  onChange={(event) => update(allocation.id, { label: event.target.value })}
                  aria-label="Additional category name"
                  className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
                />
              ) : (
                <label
                  htmlFor={`${allocation.id}-percent`}
                  className="min-w-0 flex-1 text-sm font-medium text-foreground"
                >
                  {allocation.label}
                </label>
              )}
              <div className="relative w-24 shrink-0">
                <input
                  id={`${allocation.id}-percent`}
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  inputMode="numeric"
                  value={allocation.percent}
                  onChange={(event) =>
                    update(allocation.id, {
                      percent: clampPercent(Number(event.target.value) || 0),
                    })
                  }
                  aria-label={`${allocation.label} percentage`}
                  className="w-full rounded-xl border border-border bg-background py-3 pl-3 pr-8 text-right font-mono text-base text-foreground outline-none focus:border-accent"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  %
                </span>
              </div>
              {allocation.custom && (
                <button
                  type="button"
                  onClick={() => removeCategory(allocation.id)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-lg text-muted-foreground hover:border-destructive hover:text-destructive"
                  aria-label={`Remove ${allocation.label}`}
                >
                  ×
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {customCount < MAX_CUSTOM_CATEGORIES && (
        <button
          type="button"
          onClick={addCategory}
          className="w-full rounded-xl border border-dashed border-border py-3 text-sm text-muted-foreground transition-colors hover:border-accent hover:text-foreground"
        >
          + Add another category
        </button>
      )}

      <section
        className={`rounded-2xl border p-5 ${
          total === 100
            ? "border-emerald-600/30 bg-emerald-600/10"
            : total > 100
              ? "border-destructive/30 bg-destructive/10"
              : "border-border bg-card/70"
        }`}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-foreground">Total allocation</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {total === 100
                ? "Perfect. Your typical week adds up to 100%."
                : total < 100
                  ? `You still have ${remaining}% left to allocate.`
                  : `Reduce your allocations by ${Math.abs(remaining)}%.`}
            </p>
          </div>
          <span className="shrink-0 font-mono text-xl font-semibold text-foreground">
            {total}% / 100%
          </span>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-[width] ${total > 100 ? "bg-destructive" : "bg-accent"}`}
            style={{ width: `${Math.min(100, total)}%` }}
          />
        </div>
        {hasInvalidLabels && (
          <p className="mt-3 text-xs text-destructive">
            Every additional category needs a unique name.
          </p>
        )}
      </section>

      <button
        type="button"
        onClick={onSubmit}
        disabled={!canSubmit}
        className="w-full rounded-full bg-primary py-4 text-base font-medium text-primary-foreground shadow-lg transition-opacity hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {submitting
          ? "Submitting…"
          : total === 100
            ? "Submit typical week"
            : "Complete 100% to submit"}
      </button>
    </div>
  );
}
