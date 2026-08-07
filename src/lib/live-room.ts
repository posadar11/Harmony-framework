import type { DomainCircle } from "@/lib/diagram-types";
import { DEFAULT_DOMAINS } from "@/lib/diagram-types";
import { domainTimeShare } from "@/lib/diagram-geometry";
import type { WeeklySubmission } from "@/lib/weekly-allocation";
import { supabase } from "@/integrations/supabase/client";

export interface RoomSubmission {
  current: DomainCircle[];
  ideal: DomainCircle[];
}

export function createRoomCode() {
  const randomValue =
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().replaceAll("-", "")
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
  return randomValue.slice(0, 8).toUpperCase();
}

export function averageDiagram(
  submissions: RoomSubmission[],
  side: "current" | "ideal",
): DomainCircle[] {
  return DEFAULT_DOMAINS.filter((domain) => domain.label !== "Time for myself").map(
    (domain, index) => {
      const matches = submissions.map((submission) =>
        submission[side].find((circle) => circle.label === domain.label),
      );
      const enabled = matches.filter((circle) => circle?.enabled);
      const percent =
        submissions.length === 0
          ? 0
          : matches.reduce((sum, circle) => sum + (circle?.enabled ? circle.percent : 0), 0) /
            submissions.length;
      const timeShare =
        submissions.length === 0
          ? 0
          : matches.reduce((sum, circle) => sum + (circle ? domainTimeShare(circle) : 0), 0) /
            submissions.length;

      return {
        ...domain,
        id: `average-${side}-${index}`,
        percent,
        timeShare,
        enabled: percent > 0,
        x:
          enabled.length > 0
            ? enabled.reduce((sum, circle) => sum + (circle?.x ?? 0), 0) / enabled.length
            : domain.x,
        y:
          enabled.length > 0
            ? enabled.reduce((sum, circle) => sum + (circle?.y ?? 0), 0) / enabled.length
            : domain.y,
      };
    },
  );
}

export async function broadcastSubmission(room: string, submission: RoomSubmission) {
  return broadcastRoomEvent(room, "diagram-submitted", submission);
}

export async function broadcastWeeklySubmission(room: string, submission: WeeklySubmission) {
  return broadcastRoomEvent(room, "weekly-submitted", submission);
}

async function broadcastRoomEvent(
  room: string,
  event: "diagram-submitted" | "weekly-submitted",
  payload: RoomSubmission | WeeklySubmission,
) {
  if (!room) return false;
  const channel = supabase.channel(`harmony-room-${room}`);

  return new Promise<boolean>((resolve) => {
    const timeout = window.setTimeout(() => {
      void supabase.removeChannel(channel);
      resolve(false);
    }, 4000);

    channel.subscribe(async (status) => {
      if (status !== "SUBSCRIBED") return;
      const result = await channel.send({
        type: "broadcast",
        event,
        payload,
      });
      window.clearTimeout(timeout);
      await supabase.removeChannel(channel);
      resolve(result === "ok");
    });
  });
}
