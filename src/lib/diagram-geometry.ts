import type { DomainCircle } from "@/lib/diagram-types";

export const YOU_RADIUS_RATIO = 0.28;

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function domainRadiusRatio(percent: number) {
  return YOU_RADIUS_RATIO * Math.sqrt(clamp(percent, 0, 100) / 100);
}

/** Keep the complete domain circle visible on the square canvas without forcing it inside You. */
export function constrainDomainToCanvas(x: number, y: number, percent: number) {
  const radius = domainRadiusRatio(percent);
  const edge = radius + 0.01;
  return {
    x: clamp(x, edge, 1 - edge),
    y: clamp(y, edge, 1 - edge),
  };
}

/** Percentage of the You circle covered by one domain circle. */
export function domainTimeShare(circle: DomainCircle) {
  if (!circle.enabled) return 0;

  const r1 = YOU_RADIUS_RATIO;
  const r2 = domainRadiusRatio(circle.percent);
  const distance = Math.hypot(circle.x - 0.5, circle.y - 0.5);
  const youArea = Math.PI * r1 * r1;

  if (distance >= r1 + r2) return 0;
  if (distance <= Math.abs(r1 - r2)) {
    const intersectionArea = Math.PI * Math.min(r1, r2) ** 2;
    return (intersectionArea / youArea) * 100;
  }

  const r1Squared = r1 * r1;
  const r2Squared = r2 * r2;
  const firstAngle = Math.acos(
    clamp((distance * distance + r1Squared - r2Squared) / (2 * distance * r1), -1, 1),
  );
  const secondAngle = Math.acos(
    clamp((distance * distance + r2Squared - r1Squared) / (2 * distance * r2), -1, 1),
  );
  const triangleArea =
    0.5 *
    Math.sqrt(
      Math.max(
        0,
        (-distance + r1 + r2) * (distance + r1 - r2) * (distance - r1 + r2) * (distance + r1 + r2),
      ),
    );
  const intersectionArea = r1Squared * firstAngle + r2Squared * secondAngle - triangleArea;

  return clamp((intersectionArea / youArea) * 100, 0, 100);
}

/** Approximate the union of all domains, clipped to the You circle. */
export function estimateUniqueCoverage(circles: DomainCircle[], sampleGrid = 120) {
  const domains = circles
    .filter((circle) => circle.enabled)
    .map((circle) => ({
      x: circle.x,
      y: circle.y,
      radiusSquared: domainRadiusRatio(circle.percent) ** 2,
    }));
  if (domains.length === 0) return 0;

  let pointsInsideYou = 0;
  let coveredPoints = 0;
  const youRadiusSquared = YOU_RADIUS_RATIO * YOU_RADIUS_RATIO;
  for (let row = 0; row < sampleGrid; row++) {
    const y = (row + 0.5) / sampleGrid;
    for (let column = 0; column < sampleGrid; column++) {
      const x = (column + 0.5) / sampleGrid;
      const youDx = x - 0.5;
      const youDy = y - 0.5;
      if (youDx * youDx + youDy * youDy > youRadiusSquared) continue;
      pointsInsideYou++;
      if (
        domains.some((domain) => {
          const dx = x - domain.x;
          const dy = y - domain.y;
          return dx * dx + dy * dy <= domain.radiusSquared;
        })
      ) {
        coveredPoints++;
      }
    }
  }

  return pointsInsideYou === 0 ? 0 : (coveredPoints / pointsInsideYou) * 100;
}

/** Approximate the portion of You covered by both domain circles. */
export function estimatePairOverlap(first: DomainCircle, second: DomainCircle, sampleGrid = 80) {
  if (!first.enabled || !second.enabled) return 0;
  const firstRadiusSquared = domainRadiusRatio(first.percent) ** 2;
  const secondRadiusSquared = domainRadiusRatio(second.percent) ** 2;
  const youRadiusSquared = YOU_RADIUS_RATIO * YOU_RADIUS_RATIO;
  let pointsInsideYou = 0;
  let sharedPoints = 0;

  for (let row = 0; row < sampleGrid; row++) {
    const y = (row + 0.5) / sampleGrid;
    for (let column = 0; column < sampleGrid; column++) {
      const x = (column + 0.5) / sampleGrid;
      const youDx = x - 0.5;
      const youDy = y - 0.5;
      if (youDx * youDx + youDy * youDy > youRadiusSquared) continue;
      pointsInsideYou++;

      const firstDx = x - first.x;
      const firstDy = y - first.y;
      const secondDx = x - second.x;
      const secondDy = y - second.y;
      if (
        firstDx * firstDx + firstDy * firstDy <= firstRadiusSquared &&
        secondDx * secondDx + secondDy * secondDy <= secondRadiusSquared
      ) {
        sharedPoints++;
      }
    }
  }

  return pointsInsideYou === 0 ? 0 : (sharedPoints / pointsInsideYou) * 100;
}
