export type RelationshipType =
  | "work"
  | "manager"
  | "team"
  | "close"
  | "family"
  | "friends"
  | "hobbies"
  | "community"
  | "other";

export interface Circle {
  id: string;
  label: string;
  type: RelationshipType;
  /** Distance from center as a fraction of self radius. 0 = full overlap, 1.4 = no overlap */
  distance: number;
  /** Angle in radians around the self circle */
  angle: number;
  /** Size as a percentage of the You circle's area (0-100+). */
  size: number;
}

export interface VennState {
  current: Circle[];
  ideal: Circle[];
}

export const TYPE_COLORS: Record<RelationshipType, string> = {
  work: "var(--circle-work)",
  manager: "var(--circle-work)",
  team: "var(--circle-work)",
  close: "var(--circle-partner)",
  family: "var(--circle-family)",
  friends: "var(--circle-friends)",
  hobbies: "var(--circle-hobbies)",
  community: "var(--circle-friends)",
  other: "var(--circle-other)",
};

export const TYPE_LABELS: Record<RelationshipType, string> = {
  work: "Work",
  manager: "Manager",
  team: "Team / colleagues",
  close: "Close relationship",
  family: "Family",
  friends: "Friends",
  hobbies: "Hobbies",
  community: "Community",
  other: "Other",
};

export const DEFAULT_VENN: VennState = {
  current: [],
  ideal: [],
};

export function makeCircle(type: RelationshipType, label?: string, index = 0): Circle {
  return {
    id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    label: label ?? TYPE_LABELS[type],
    type,
    distance: 0.85,
    angle: (index * Math.PI * 2) / 6 - Math.PI / 2,
    size: 40,
  };
}