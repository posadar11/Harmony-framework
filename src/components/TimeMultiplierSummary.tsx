import {
  estimateCategoryDistribution,
  PRESENTATION_DOMAIN_RADIUS_RATIO,
  PRESENTATION_YOU_RADIUS_RATIO,
} from "@/lib/diagram-geometry";
import type { DomainCircle } from "@/lib/diagram-types";

interface TimeMultiplierSummaryProps {
  circles: DomainCircle[];
}

export function TimeMultiplierSummary({ circles }: TimeMultiplierSummaryProps) {
  const distribution = estimateCategoryDistribution(
    circles,
    140,
    PRESENTATION_YOU_RADIUS_RATIO,
    PRESENTATION_DOMAIN_RADIUS_RATIO,
  );
  const overlaps = distribution.pairOverlaps.slice(0, 3);
  const overlapExtra = Math.max(0, distribution.displayTotal - distribution.displayUniqueCoverage);

  return (
    <section className="rounded-2xl border border-border bg-card/80 p-5">
      <p className="text-xs uppercase tracking-[0.16em] text-accent">The overlap effect</p>
      <h3 className="mt-2 font-serif text-2xl text-foreground">
        100% of time. More than 100% value.
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Each percentage is the portion of You covered by that category. Shared portions appear in
        every category they serve, so the total can rise above 100%.
      </p>

      <div className="mt-5 rounded-2xl bg-accent/10 p-5 text-center">
        <strong className="font-mono text-5xl text-foreground">{distribution.displayTotal}%</strong>
        <p className="mt-2 text-sm font-medium text-foreground">total across categories</p>
        <div className="mt-3 flex items-center justify-center gap-2 font-mono text-xs text-foreground/80">
          <span>{distribution.displayUniqueCoverage}% represented once</span>
          <span className="text-accent">+</span>
          <span>{overlapExtra}% overlap</span>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-accent/30 bg-accent/5 p-4">
        <p className="text-xs font-medium text-foreground">
          {overlapExtra > 0 ? `Why +${overlapExtra}%?` : "How is this calculated?"}
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
          {overlapExtra > 0
            ? "It is not extra time. It is the same shared portion counted in every category it serves. For example, one hour shared by Work and Family is one actual hour, but it appears in both percentages."
            : "The part of each category inside You determines its percentage. A Size 100 category centered on You covers the full circle and reads 100%."}
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
