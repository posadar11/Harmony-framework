import type { DomainCircle } from "@/lib/diagram-types";

export const YOU_RADIUS_RATIO = 0.28;
export const PRESENTATION_YOU_RADIUS_RATIO = 0.21;
// At Size 100, a presentation category is exactly the same size as You.
export const PRESENTATION_DOMAIN_RADIUS_RATIO = PRESENTATION_YOU_RADIUS_RATIO;

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function domainRadiusRatio(percent: number, baseRadiusRatio = YOU_RADIUS_RATIO) {
  return baseRadiusRatio * Math.sqrt(clamp(percent, 0, 100) / 100);
}

/** Keep the complete domain circle visible on the square canvas without forcing it inside You. */
export function constrainDomainToCanvas(
  x: number,
  y: number,
  percent: number,
  domainBaseRadiusRatio = YOU_RADIUS_RATIO,
) {
  const radius = domainRadiusRatio(percent, domainBaseRadiusRatio);
  const edge = radius + 0.01;
  return {
    x: clamp(x, edge, 1 - edge),
    y: clamp(y, edge, 1 - edge),
  };
}

/** Percentage of the You circle covered by one domain circle. */
export function domainTimeShare(
  circle: DomainCircle,
  youRadiusRatio = YOU_RADIUS_RATIO,
  domainBaseRadiusRatio = youRadiusRatio,
) {
  if (!circle.enabled) return 0;

  const r1 = youRadiusRatio;
  const r2 = domainRadiusRatio(circle.percent, domainBaseRadiusRatio);
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
export function estimateUniqueCoverage(
  circles: DomainCircle[],
  sampleGrid = 120,
  youRadiusRatio = YOU_RADIUS_RATIO,
  domainBaseRadiusRatio = youRadiusRatio,
) {
  const domains = circles
    .filter((circle) => circle.enabled)
    .map((circle) => ({
      x: circle.x,
      y: circle.y,
      radiusSquared: domainRadiusRatio(circle.percent, domainBaseRadiusRatio) ** 2,
    }));
  if (domains.length === 0) return 0;

  let pointsInsideYou = 0;
  let coveredPoints = 0;
  const youRadiusSquared = youRadiusRatio * youRadiusRatio;
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

/** Approximate the portion of You covered by at least two category circles. */
export function estimateSharedCoverage(
  circles: DomainCircle[],
  sampleGrid = 120,
  youRadiusRatio = YOU_RADIUS_RATIO,
  domainBaseRadiusRatio = youRadiusRatio,
) {
  const domains = circles
    .filter((circle) => circle.enabled)
    .map((circle) => ({
      x: circle.x,
      y: circle.y,
      radiusSquared: domainRadiusRatio(circle.percent, domainBaseRadiusRatio) ** 2,
    }));
  if (domains.length < 2) return 0;

  let pointsInsideYou = 0;
  let sharedPoints = 0;
  const youRadiusSquared = youRadiusRatio * youRadiusRatio;
  for (let row = 0; row < sampleGrid; row++) {
    const y = (row + 0.5) / sampleGrid;
    for (let column = 0; column < sampleGrid; column++) {
      const x = (column + 0.5) / sampleGrid;
      const youDx = x - 0.5;
      const youDy = y - 0.5;
      if (youDx * youDx + youDy * youDy > youRadiusSquared) continue;
      pointsInsideYou++;

      let coveringDomains = 0;
      for (const domain of domains) {
        const dx = x - domain.x;
        const dy = y - domain.y;
        if (dx * dx + dy * dy <= domain.radiusSquared) coveringDomains++;
        if (coveringDomains >= 2) {
          sharedPoints++;
          break;
        }
      }
    }
  }

  return pointsInsideYou === 0 ? 0 : (sharedPoints / pointsInsideYou) * 100;
}

/**
 * Measure each presentation category as a portion of the You circle.
 * A Size 100 category centered on You therefore measures exactly 100%.
 * Overlapping portions appear in every category they serve, so the category
 * total can exceed the uniquely represented portion of the week.
 */
export function estimateCategoryDistribution(
  circles: DomainCircle[],
  sampleGrid = 120,
  youRadiusRatio = YOU_RADIUS_RATIO,
  domainBaseRadiusRatio = youRadiusRatio,
) {
  const domains = circles
    .filter((circle) => circle.enabled)
    .map((circle) => ({
      id: circle.id,
      label: circle.label,
      color: circle.color,
      x: circle.x,
      y: circle.y,
      radiusSquared: domainRadiusRatio(circle.percent, domainBaseRadiusRatio) ** 2,
    }));
  const categoryCounts = domains.map(() => 0);
  const pairCounts = new Map<string, number>();
  let pointsInsideYou = 0;
  let unionPoints = 0;
  const youRadiusSquared = youRadiusRatio * youRadiusRatio;

  for (let row = 0; row < sampleGrid; row++) {
    const y = (row + 0.5) / sampleGrid;
    for (let column = 0; column < sampleGrid; column++) {
      const x = (column + 0.5) / sampleGrid;
      const youDx = x - 0.5;
      const youDy = y - 0.5;
      if (youDx * youDx + youDy * youDy > youRadiusSquared) continue;
      pointsInsideYou++;
      const covered: number[] = [];
      domains.forEach((domain, index) => {
        const dx = x - domain.x;
        const dy = y - domain.y;
        if (dx * dx + dy * dy <= domain.radiusSquared) {
          categoryCounts[index]++;
          covered.push(index);
        }
      });
      if (covered.length === 0) continue;
      unionPoints++;
      for (let first = 0; first < covered.length; first++) {
        for (let second = first + 1; second < covered.length; second++) {
          const key = `${covered[first]}:${covered[second]}`;
          pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
        }
      }
    }
  }

  if (pointsInsideYou === 0) {
    return {
      categories: [],
      pairOverlaps: [],
      total: 0,
      displayTotal: 0,
      uniqueCoverage: 0,
      displayUniqueCoverage: 0,
      overlapValue: 0,
    };
  }

  const categories = domains.map((domain, index) => ({
    id: domain.id,
    label: domain.label,
    color: domain.color,
    percent: (categoryCounts[index] / pointsInsideYou) * 100,
  }));
  const total = categories.reduce((sum, category) => sum + category.percent, 0);
  const uniqueCoverage = (unionPoints / pointsInsideYou) * 100;
  const displayTotal = Math.round(total);
  const displayPercents = categories.map((category) => Math.floor(category.percent));
  let remainingPoints = displayTotal - displayPercents.reduce((sum, value) => sum + value, 0);
  const remainderOrder = categories
    .map((category, index) => ({ index, remainder: category.percent % 1 }))
    .sort((a, b) => b.remainder - a.remainder);
  for (let index = 0; index < remainderOrder.length && remainingPoints > 0; index++) {
    displayPercents[remainderOrder[index].index]++;
    remainingPoints--;
  }
  const displayedCategories = categories.map((category, index) => ({
    ...category,
    displayPercent: displayPercents[index],
  }));
  const pairOverlaps = [...pairCounts.entries()]
    .map(([key, count]) => {
      const [first, second] = key.split(":").map(Number);
      return {
        ids: `${domains[first].id}:${domains[second].id}`,
        labels: `${domains[first].label} + ${domains[second].label}`,
        percent: (count / pointsInsideYou) * 100,
      };
    })
    .filter((overlap) => overlap.percent >= 0.5)
    .sort((a, b) => b.percent - a.percent);

  return {
    categories: displayedCategories,
    pairOverlaps,
    total,
    displayTotal,
    uniqueCoverage,
    displayUniqueCoverage: Math.round(uniqueCoverage),
    overlapValue: Math.max(0, total - uniqueCoverage),
  };
}

/** Approximate the portion of You covered by both domain circles. */
export function estimatePairOverlap(
  first: DomainCircle,
  second: DomainCircle,
  sampleGrid = 80,
  youRadiusRatio = YOU_RADIUS_RATIO,
  domainBaseRadiusRatio = youRadiusRatio,
) {
  if (!first.enabled || !second.enabled) return 0;
  const firstRadiusSquared = domainRadiusRatio(first.percent, domainBaseRadiusRatio) ** 2;
  const secondRadiusSquared = domainRadiusRatio(second.percent, domainBaseRadiusRatio) ** 2;
  const youRadiusSquared = youRadiusRatio * youRadiusRatio;
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
