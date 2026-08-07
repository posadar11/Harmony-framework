import {
  estimatePairOverlap,
  estimateSharedCoverage,
  PRESENTATION_DOMAIN_RADIUS_RATIO,
  PRESENTATION_YOU_RADIUS_RATIO,
} from "@/lib/diagram-geometry";
import type { DomainCircle } from "@/lib/diagram-types";

interface TimeMultiplierSummaryProps {
  circles: DomainCircle[];
}

export function TimeMultiplierSummary({ circles }: TimeMultiplierSummaryProps) {
  const enabled = circles.filter((circle) => circle.enabled);
  const sharedTime = estimateSharedCoverage(
    enabled,
    100,
    PRESENTATION_YOU_RADIUS_RATIO,
    PRESENTATION_DOMAIN_RADIUS_RATIO,
  );
  const overlaps = enabled
    .flatMap((first, firstIndex) =>
      enabled.slice(firstIndex + 1).map((second) => ({
        labels: `${first.label} + ${second.label}`,
        percent: estimatePairOverlap(
          first,
          second,
          70,
          PRESENTATION_YOU_RADIUS_RATIO,
          PRESENTATION_DOMAIN_RADIUS_RATIO,
        ),
      })),
    )
    .filter((overlap) => overlap.percent >= 1)
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 3);

  return (
    <section className="rounded-2xl border border-border bg-card/80 p-5">
      <p className="text-xs uppercase tracking-[0.16em] text-accent">Shared time</p>
      <h3 className="mt-2 font-serif text-2xl text-foreground">What is this overlap doing?</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Overlap does not create more hours. It shows where one hour serves multiple parts of life.
      </p>

      <div className="mt-5 rounded-2xl bg-accent/10 p-5 text-center">
        <strong className="font-mono text-4xl text-foreground">{Math.round(sharedTime)}%</strong>
        <p className="mt-2 text-sm font-medium text-foreground">
          of your week serves two or more categories
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Shared time is counted once—not added as extra time.
        </p>
      </div>

      <div className="mt-4 rounded-xl border border-accent/30 bg-background p-4">
        <p className="text-xs uppercase tracking-[0.13em] text-accent">Intentionality check</p>
        <p className="mt-2 text-sm leading-relaxed text-foreground/85">
          Is this overlap chosen? Does it strengthen each category—or blur a boundary?
        </p>
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
            No shared time yet. Move two categories into the same part of You.
          </p>
        )}
      </div>
    </section>
  );
}
