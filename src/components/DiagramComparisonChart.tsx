import { domainTimeShare } from "@/lib/diagram-geometry";
import type { DomainCircle } from "@/lib/diagram-types";

interface DiagramComparisonChartProps {
  current: DomainCircle[];
  ideal: DomainCircle[];
}

const CORE_CATEGORY_ORDER = ["Work", "Close relationships", "Family", "Hobbies", "Community"];

function shareForLabel(circles: DomainCircle[], label: string) {
  const circle = circles.find((item) => item.label === label);
  return circle ? Math.round(domainTimeShare(circle)) : 0;
}

export function DiagramComparisonChart({ current, ideal }: DiagramComparisonChartProps) {
  const customLabels = [...current, ...ideal]
    .filter((circle) => circle.custom)
    .map((circle) => circle.label);
  const labels = Array.from(new Set([...CORE_CATEGORY_ORDER, ...customLabels]));
  const rows = labels.map((label) => ({
    label,
    current: shareForLabel(current, label),
    ideal: shareForLabel(ideal, label),
  }));

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card/70 p-5 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-accent">Your comparison</p>
          <h3 className="mt-1 font-serif text-2xl text-foreground">
            Current and Ideal by category
          </h3>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Each bar shows the percentage of that domain inside You. Compare the two bars to see
            where you want more, less, or the same amount of time.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-primary" /> Current
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-accent" /> Ideal
          </span>
        </div>
      </div>

      <div
        className="mt-6 space-y-5"
        role="group"
        aria-label="Current and ideal bar chart by category"
      >
        {rows.map((row) => (
          <div key={row.label}>
            <div className="mb-2 flex items-center justify-between gap-3">
              <h4 className="text-sm font-medium text-foreground">{row.label}</h4>
              <span className="text-[11px] text-muted-foreground">
                {row.current === row.ideal
                  ? "No difference"
                  : `${Math.abs(row.ideal - row.current)} ${Math.abs(row.ideal - row.current) === 1 ? "point" : "points"} difference`}
              </span>
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-[3.5rem_minmax(0,1fr)_2.5rem] items-center gap-2">
                <span className="text-[11px] text-muted-foreground">Current</span>
                <div className="h-3 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                  <div
                    className="h-full min-w-0 rounded-full bg-primary transition-[width] duration-500"
                    style={{ width: `${row.current}%` }}
                  />
                </div>
                <span className="text-right font-mono text-xs text-foreground">{row.current}%</span>
              </div>
              <div className="grid grid-cols-[3.5rem_minmax(0,1fr)_2.5rem] items-center gap-2">
                <span className="text-[11px] text-muted-foreground">Ideal</span>
                <div className="h-3 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                  <div
                    className="h-full min-w-0 rounded-full bg-accent transition-[width] duration-500"
                    style={{ width: `${row.ideal}%` }}
                  />
                </div>
                <span className="text-right font-mono text-xs text-foreground">{row.ideal}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
