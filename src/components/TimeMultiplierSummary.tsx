import {
  domainTimeShare,
  estimatePairOverlap,
  estimateUniqueCoverage,
} from "@/lib/diagram-geometry";
import type { DomainCircle } from "@/lib/diagram-types";

interface TimeMultiplierSummaryProps {
  circles: DomainCircle[];
}

function buildDomainGradient(items: { share: number; color: string }[], total: number) {
  if (total <= 0) return "var(--muted)";
  let position = 0;
  return `conic-gradient(from -90deg, ${items
    .filter((item) => item.share > 0)
    .map((item) => {
      const start = position;
      position += (item.share / total) * 100;
      return `${item.color} ${start}% ${position}%`;
    })
    .join(", ")})`;
}

export function TimeMultiplierSummary({ circles }: TimeMultiplierSummaryProps) {
  const enabled = circles.filter((circle) => circle.enabled);
  const shares = enabled.map((circle) => ({
    ...circle,
    share: domainTimeShare(circle),
  }));
  const combinedValue = shares.reduce((sum, circle) => sum + circle.share, 0);
  const uniqueTime = estimateUniqueCoverage(enabled, 90);
  const sharedValue = Math.max(0, combinedValue - uniqueTime);
  const personalTime = Math.max(0, 100 - uniqueTime);
  const multiplier = uniqueTime > 0 ? combinedValue / uniqueTime : 0;
  const overlaps = enabled
    .flatMap((first, firstIndex) =>
      enabled.slice(firstIndex + 1).map((second) => ({
        labels: `${first.label} + ${second.label}`,
        percent: estimatePairOverlap(first, second, 60),
      })),
    )
    .filter((overlap) => overlap.percent >= 1)
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 4);

  return (
    <section className="rounded-2xl border border-border bg-card/80 p-5">
      <p className="text-xs uppercase tracking-[0.16em] text-accent">The multiplier effect</p>
      <h3 className="mt-2 font-serif text-2xl text-foreground">One hour can serve two domains</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Your week is still 100% of your actual time. When one moment belongs to more than one
        relationship or activity, its combined value can add up to more than 100%.
      </p>

      <div className="mt-5 grid items-center gap-5 sm:grid-cols-[180px_1fr]">
        <div className="relative mx-auto h-44 w-44">
          <div
            className="absolute inset-0 rounded-full border border-foreground/15"
            style={{ background: buildDomainGradient(shares, combinedValue) }}
          />
          <div className="absolute inset-[28px] flex flex-col items-center justify-center rounded-full border border-border bg-background text-center shadow-sm">
            <strong className="font-serif text-4xl text-foreground">
              {Math.round(combinedValue)}%
            </strong>
            <span className="mt-1 px-2 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              combined value
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="rounded-xl bg-muted/60 p-3">
            <strong className="font-mono text-lg text-foreground">{Math.round(uniqueTime)}%</strong>
            <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
              unique time used
            </p>
          </div>
          <div className="rounded-xl bg-muted/60 p-3">
            <strong className="font-mono text-lg text-foreground">
              {Math.round(sharedValue)}%
            </strong>
            <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
              shared value
            </p>
          </div>
          <div className="rounded-xl bg-muted/60 p-3">
            <strong className="font-mono text-lg text-foreground">
              {Math.round(personalTime)}%
            </strong>
            <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
              unoccupied personal time
            </p>
          </div>
          <div className="rounded-xl bg-accent/10 p-3">
            <strong className="font-mono text-lg text-foreground">{multiplier.toFixed(1)}×</strong>
            <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
              value per used hour
            </p>
          </div>
        </div>
      </div>

      {overlaps.length > 0 && (
        <div className="mt-5 border-t border-border/70 pt-4">
          <p className="text-xs font-medium text-foreground">Largest overlaps inside You</p>
          <ul className="mt-2 space-y-2">
            {overlaps.map((overlap) => (
              <li key={overlap.labels} className="flex items-center justify-between gap-3 text-xs">
                <span className="text-foreground/75">{overlap.labels}</span>
                <strong className="font-mono text-foreground">
                  {Math.round(overlap.percent)}%
                </strong>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
