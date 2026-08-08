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

function buildPieLabels(allocations: WeeklyAllocation[]) {
  let position = 0;
  return allocations.map((allocation, index) => {
    const midpoint = position + allocation.percent / 2;
    position += allocation.percent;
    const angle = (midpoint / 100) * Math.PI * 2 - Math.PI / 2;
    const radius =
      allocations.length === 1 ? 0 : allocation.percent < 8 ? 36 + (index % 2) * 4 : 30;
    return {
      allocation,
      left: 50 + Math.cos(angle) * radius,
      top: 50 + Math.sin(angle) * radius,
    };
  });
}

export function WeeklyPieChart({
  allocations,
  title = "Your typical week",
  subtitle = "A 100% view of how your week is distributed.",
  compact = false,
}: WeeklyPieChartProps) {
  const visible = allocations.filter((allocation) => allocation.percent > 0);
  const pieLabels = buildPieLabels(visible);

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
            className="relative mx-auto aspect-square w-full max-w-[300px] rounded-full border-2 border-foreground/20 shadow-sm"
            style={{ background: buildGradient(visible) }}
            role="img"
            aria-label={visible
              .map((allocation) => `${allocation.label}: ${Math.round(allocation.percent)}%`)
              .join(", ")}
          >
            {pieLabels.map(({ allocation, left, top }) => (
              <span
                key={allocation.id}
                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-foreground/10 bg-background/85 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-foreground shadow-sm sm:text-xs"
                style={{ left: `${left}%`, top: `${top}%` }}
                aria-hidden="true"
              >
                {Math.round(allocation.percent)}%
              </span>
            ))}
          </div>
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
