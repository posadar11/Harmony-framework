export type RelationshipType =
  | "work"
  | "close"
  | "family"
  | "hobbies"
  | "community";

export const RELATIONSHIP_TYPES: RelationshipType[] = [
  "work",
  "close",
  "family",
  "hobbies",
  "community",
];

export function isRelationshipType(type: string): type is RelationshipType {
  return RELATIONSHIP_TYPES.includes(type as RelationshipType);
}

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
  close: "var(--circle-partner)",
  family: "var(--circle-family)",
  hobbies: "var(--circle-hobbies)",
  community: "var(--circle-community)",
};

export const TYPE_LABELS: Record<RelationshipType, string> = {
  work: "Work",
  close: "Close relationships",
  family: "Family",
  hobbies: "Hobbies",
  community: "Community",
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
