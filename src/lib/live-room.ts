import type { DomainCircle } from "@/lib/diagram-types";
import { DEFAULT_DOMAINS } from "@/lib/diagram-types";
import { supabase } from "@/integrations/supabase/client";

export interface RoomSubmission {
  current: DomainCircle[];
  ideal: DomainCircle[];
}

export function createRoomCode() {
  return crypto.randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase();
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

      return {
        ...domain,
        id: `average-${side}-${index}`,
        percent,
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
  if (!room) return;
  const channel = supabase.channel(`harmony-room-${room}`);

  await new Promise<void>((resolve) => {
    const timeout = window.setTimeout(() => {
      void supabase.removeChannel(channel);
      resolve();
    }, 4000);

    channel.subscribe(async (status) => {
      if (status !== "SUBSCRIBED") return;
      await channel.send({ type: "broadcast", event: "diagram-submitted", payload: submission });
      window.clearTimeout(timeout);
      await supabase.removeChannel(channel);
      resolve();
    });
  });
}
