import type { WeeklyAllocation } from "@/lib/weekly-allocation";

interface WeeklyPieChartProps {
  allocations: WeeklyAllocation[];
  title?: string;
  subtitle?: string;
  compact?: boolean;
}

function buildGradient(allocations: WeeklyAllocation[]) {
  let position = 0;
  const stops = allocations
    .filter((allocation) => allocation.percent > 0)
    .map((allocation) => {
      const start = position;
      position += allocation.percent;
      return `${allocation.color} ${start}% ${position}%`;
    });
  return stops.length > 0 ? `conic-gradient(from -90deg, ${stops.join(", ")})` : "var(--muted)";
}

export function WeeklyPieChart({
  allocations,
  title = "Your typical week",
  subtitle = "A 100% view of how your week is distributed.",
  compact = false,
}: WeeklyPieChartProps) {
  const visible = allocations.filter((allocation) => allocation.percent > 0);

  return (
    <section className="rounded-2xl border border-border bg-card/70 p-5 md:p-7">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.16em] text-accent">Exercise 1 · Your result</p>
        <h2 className="mt-2 font-serif text-2xl text-foreground md:text-3xl">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
      </div>

      <div
        className={`mt-7 grid items-center gap-7 ${compact ? "md:grid-cols-[1fr_1.15fr]" : "md:grid-cols-2"}`}
      >
        <div className="mx-auto w-full max-w-sm rounded-2xl border border-border/60 bg-background/50 p-5">
          <div
            className="mx-auto aspect-square w-full max-w-[300px] rounded-full border-2 border-foreground/20 shadow-sm"
            style={{ background: buildGradient(visible) }}
            role="img"
            aria-label={visible
              .map((allocation) => `${allocation.label}: ${Math.round(allocation.percent)}%`)
              .join(", ")}
          />
        </div>

        <div className="space-y-3">
          {visible.map((allocation) => {
            const bubbleSize = 14 + Math.sqrt(allocation.percent / 100) * 34;
            return (
              <div
                key={allocation.id}
                className="flex min-h-14 items-center gap-3 rounded-xl border border-border/70 bg-background/60 px-4 py-3"
              >
                <span
                  className="shrink-0 rounded-full border border-foreground/15"
                  style={{
                    width: bubbleSize,
                    height: bubbleSize,
                    backgroundColor: allocation.color,
                  }}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1 text-sm font-medium text-foreground">
                  {allocation.label}
                </span>
                <span className="font-mono text-sm font-semibold text-foreground">
                  {Math.round(allocation.percent)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
