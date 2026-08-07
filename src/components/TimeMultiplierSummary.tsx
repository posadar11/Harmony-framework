import {
  estimateCategoryDistribution,
  PRESENTATION_DOMAIN_RADIUS_RATIO,
} from "@/lib/diagram-geometry";
import type { DomainCircle } from "@/lib/diagram-types";

interface TimeMultiplierSummaryProps {
  circles: DomainCircle[];
}

export function TimeMultiplierSummary({ circles }: TimeMultiplierSummaryProps) {
  const distribution = estimateCategoryDistribution(circles, 140, PRESENTATION_DOMAIN_RADIUS_RATIO);
  const overlaps = distribution.pairOverlaps.slice(0, 3);

  return (
    <section className="rounded-2xl border border-border bg-card/80 p-5">
      <p className="text-xs uppercase tracking-[0.16em] text-accent">The overlap effect</p>
      <h3 className="mt-2 font-serif text-2xl text-foreground">
        100% of time. More than 100% value.
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Your week stays fixed. Shared hours appear in every category they serve, so the category
        percentages can add above 100%.
      </p>

      <div className="mt-5 rounded-2xl bg-accent/10 p-5 text-center">
        <strong className="font-mono text-5xl text-foreground">{distribution.displayTotal}%</strong>
        <p className="mt-2 text-sm font-medium text-foreground">total across categories</p>
        <p className="mt-2 text-xs text-muted-foreground">
          100% actual week + {Math.max(0, distribution.displayTotal - 100)}% counted again through
          overlap
        </p>
      </div>

      <div className="mt-4 rounded-xl border border-border bg-background p-4">
        <div className="flex items-center justify-between gap-3 text-xs font-medium text-foreground">
          <span>Category distribution</span>
          <span className="font-mono">Total {distribution.displayTotal}%</span>
        </div>
        <ul className="mt-3 space-y-2">
          {distribution.categories.map((category) => (
            <li key={category.id} className="flex items-center justify-between gap-3 text-xs">
              <span className="flex min-w-0 items-center gap-2 text-foreground/75">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: category.color }}
                />
                <span className="truncate">{category.label}</span>
              </span>
              <strong className="font-mono text-foreground">{category.displayPercent}%</strong>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 border-t border-border/70 pt-4">
        <p className="text-xs font-medium text-foreground">Where time overlaps</p>
        {overlaps.length > 0 ? (
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
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">
            No overlap yet: the categories add to exactly 100%.
          </p>
        )}
      </div>
    </section>
  );
}
