export interface WeeklyAllocation {
  id: string;
  label: string;
  percent: number;
  color: string;
  custom?: boolean;
}

export interface WeeklySubmission {
  participantId: string;
  name?: string;
  allocations: WeeklyAllocation[];
}

export const WEEKLY_COLORS = [
  "#597F9B",
  "#B8A05E",
  "#B97979",
  "#9B78AA",
  "#C49062",
  "#6E9A78",
  "#5F9B96",
  "#A77D6F",
  "#7D88AD",
  "#AA8D55",
];

export const WEEKLY_CATEGORY_LABELS = [
  "Work",
  "Family",
  "Close relationships",
  "Hobbies",
  "Time for myself",
];

export function makeWeeklyAllocations(): WeeklyAllocation[] {
  return WEEKLY_CATEGORY_LABELS.map((label, index) => ({
    id: `weekly-${index}`,
    label,
    percent: 0,
    color: WEEKLY_COLORS[index],
  }));
}

export function weeklyAllocationTotal(allocations: WeeklyAllocation[]) {
  return allocations.reduce((sum, allocation) => sum + allocation.percent, 0);
}

export function averageWeeklyAllocations(submissions: WeeklySubmission[]): WeeklyAllocation[] {
  if (submissions.length === 0) return [];

  const customLabels = submissions.flatMap((submission) =>
    submission.allocations.filter((allocation) => allocation.custom).map((item) => item.label),
  );
  const labels = Array.from(new Set([...WEEKLY_CATEGORY_LABELS, ...customLabels]));

  return labels
    .map((label, index) => {
      const firstMatch = submissions
        .flatMap((submission) => submission.allocations)
        .find((allocation) => allocation.label === label);
      const percent =
        submissions.reduce(
          (sum, submission) =>
            sum +
            (submission.allocations.find((allocation) => allocation.label === label)?.percent ?? 0),
          0,
        ) / submissions.length;

      return {
        id: `weekly-average-${index}`,
        label,
        percent,
        color: firstMatch?.color ?? WEEKLY_COLORS[index % WEEKLY_COLORS.length],
        custom: !WEEKLY_CATEGORY_LABELS.includes(label),
      };
    })
    .filter((allocation) => allocation.percent > 0);
}
