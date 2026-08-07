import {
  domainTimeShare,
  estimateUniqueCoverage,
  PRESENTATION_YOU_RADIUS_RATIO,
} from "@/lib/diagram-geometry";
import type { DomainCircle } from "@/lib/diagram-types";

interface TimeMultiplierSummaryProps {
  circles: DomainCircle[];
}

export function TimeMultiplierSummary({ circles }: TimeMultiplierSummaryProps) {
  const enabled = circles.filter((circle) => circle.enabled);
  const shares = enabled.map((circle) => ({
    ...circle,
    share: domainTimeShare(circle, PRESENTATION_YOU_RADIUS_RATIO),
  }));
  const combinedValue = shares.reduce((sum, circle) => sum + circle.share, 0);
  const uniqueTime = estimateUniqueCoverage(enabled, 90, PRESENTATION_YOU_RADIUS_RATIO);
  const sharedValue = Math.max(0, combinedValue - uniqueTime);

  return (
    <section className="rounded-2xl border border-border bg-card/80 p-5">
      <p className="text-xs uppercase tracking-[0.16em] text-accent">How to read it</p>
      <h3 className="mt-2 font-serif text-2xl text-foreground">Overlap adds value—not hours.</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        One hour shared by Work and Family is still one hour, but it contributes to both.
      </p>

      <div className="mt-5 space-y-2 text-center">
        <div className="rounded-xl bg-muted/60 p-4">
          <strong className="font-mono text-3xl text-foreground">{Math.round(uniqueTime)}%</strong>
          <p className="mt-1 text-xs text-muted-foreground">of your actual week is inside You</p>
        </div>
        <div className="font-serif text-xl text-accent">+</div>
        <div className="rounded-xl bg-accent/10 p-4">
          <strong className="font-mono text-3xl text-foreground">{Math.round(sharedValue)}%</strong>
          <p className="mt-1 text-xs text-muted-foreground">is counted again because it overlaps</p>
        </div>
        <div className="font-serif text-xl text-accent">=</div>
        <div className="rounded-xl border border-accent/35 bg-background p-4">
          <strong className="font-mono text-3xl text-foreground">
            {Math.round(combinedValue)}%
          </strong>
          <p className="mt-1 text-xs font-medium text-foreground">total value across categories</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Not extra time.</p>
        </div>
      </div>
    </section>
  );
}
