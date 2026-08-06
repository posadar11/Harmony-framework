export interface DomainCircle {
  id: string;
  label: string;
  percent: number; // 0-100 relative sizing
  x: number; // 0-1 fraction inside canvas
  y: number; // 0-1 fraction inside canvas
  enabled: boolean;
  color: string;
  custom?: boolean;
  /** Optional precomputed time share, used when displaying a room average. */
  timeShare?: number;
  /** Force label to sit centered on the circle (used in static presentation views). */
  labelInside?: boolean;
}

export const DEFAULT_COLORS = [
  "#7BA7C5", // work — muted blue
  "#C58F8F", // close — rose
  "#B8A05E", // family — ochre
  "#8FA98A", // community — sage
  "#B592C1", // hobbies — lavender
  "#C7B08A", // me time — sand
  "#6DAEA6", // custom slot 1 — teal
  "#B5867C", // custom slot 2 — clay
];

export const DEFAULT_DOMAINS: Omit<DomainCircle, "id">[] = [
  { label: "Work", percent: 60, x: 0.32, y: 0.38, enabled: true, color: DEFAULT_COLORS[0] },
  {
    label: "Close relationships",
    percent: 20,
    x: 0.6,
    y: 0.4,
    enabled: true,
    color: DEFAULT_COLORS[1],
  },
  { label: "Family", percent: 20, x: 0.45, y: 0.62, enabled: true, color: DEFAULT_COLORS[2] },
  { label: "Community", percent: 20, x: 0.72, y: 0.65, enabled: true, color: DEFAULT_COLORS[3] },
  { label: "Hobbies", percent: 20, x: 0.25, y: 0.7, enabled: true, color: DEFAULT_COLORS[4] },
  {
    label: "Time for myself",
    percent: 20,
    x: 0.55,
    y: 0.25,
    enabled: true,
    color: DEFAULT_COLORS[5],
  },
];

export function makeDefaultDiagram(): DomainCircle[] {
  return DEFAULT_DOMAINS.map((d, i) => ({ ...d, id: `d-${i}` }));
}

/** All domains present but toggled off; optionally leave one label enabled (e.g. "Work"). */
export function makeStartingDiagram(enabledLabels: string[] = []): DomainCircle[] {
  return DEFAULT_DOMAINS.map((d, i) => ({
    ...d,
    enabled: enabledLabels.includes(d.label),
    // Stable IDs keep the server-rendered diagram identical during browser hydration.
    id: `d-${i}`,
  }));
}
