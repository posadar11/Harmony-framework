import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { WeeklyAllocationForm } from "@/components/WeeklyAllocationForm";
import { WeeklyPieChart } from "@/components/WeeklyPieChart";
import { supabase } from "@/integrations/supabase/client";
import { broadcastWeeklySubmission } from "@/lib/live-room";
import {
  makeWeeklyAllocations,
  weeklyAllocationTotal,
  type WeeklyAllocation,
} from "@/lib/weekly-allocation";

function normalizeRoomCode(value: unknown): string {
  return typeof value === "string"
    ? value
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 8)
    : "";
}

export const Route = createFileRoute("/join")({
  validateSearch: (search: Record<string, unknown>) => ({
    room: normalizeRoomCode(search.room),
  }),
  head: () => ({
    meta: [
      { title: "Build your diagram, The Harmony of Relationships" },
      {
        name: "description",
        content: "Map how a typical week is distributed across the parts of your life.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Build your diagram" },
      {
        property: "og:description",
        content: "Sketch how your time is distributed across the parts of your life.",
      },
    ],
  }),
  component: JoinPage,
});

function getStorageErrorMessage(error: unknown): string {
  const details =
    error && typeof error === "object"
      ? `${"code" in error ? String(error.code) : ""} ${
          "message" in error ? String(error.message) : ""
        }`
      : error instanceof Error
        ? error.message
        : "";

  if (details.includes("PGRST205") || details.includes("diagram_submissions")) {
    return "Your diagram reached the live room, but this email was not saved because the Supabase submissions table still needs to be created.";
  }

  if (details.includes("Missing Supabase environment variable")) {
    return "Your diagram reached the live room, but this email was not saved because Supabase is not connected on this deployment.";
  }

  return (
    details.trim() || "Your email could not be saved. Your room submission was still delivered."
  );
}

type Step = "weekly" | "weekly-result";

function JoinPage() {
  const { room } = Route.useSearch();
  return room ? <ExercisePage room={room} /> : <RoomCodeEntry />;
}

function RoomCodeEntry() {
  const [roomInput, setRoomInput] = useState("");
  const [roomError, setRoomError] = useState("");

  const connectToRoom = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const room = normalizeRoomCode(roomInput);
    if (room.length !== 8) {
      setRoomError("Enter the eight character room code shown by your facilitator.");
      return;
    }
    window.location.assign(`/join?room=${encodeURIComponent(room)}`);
  };

  return (
    <div className="min-h-screen bg-background venn-bg">
      <main className="mx-auto flex min-h-screen max-w-lg items-center px-4 py-10">
        <section className="w-full rounded-3xl border border-border bg-card/80 p-6 text-center shadow-sm md:p-9">
          <p className="text-xs uppercase tracking-[0.2em] text-accent">The Diagram</p>
          <h1 className="mt-3 font-serif text-3xl text-foreground md:text-4xl">
            Join your workshop room
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground md:text-base">
            Enter the room code displayed by your facilitator. The same QR code works for every
            workshop.
          </p>

          <form onSubmit={connectToRoom} className="mt-7">
            <label
              htmlFor="room-code"
              className="block text-left text-sm font-medium text-foreground"
            >
              Room code
            </label>
            <input
              id="room-code"
              type="text"
              value={roomInput}
              onChange={(event) => {
                setRoomInput(normalizeRoomCode(event.target.value));
                setRoomError("");
              }}
              autoComplete="off"
              autoCapitalize="characters"
              inputMode="text"
              maxLength={8}
              placeholder="AB12CD34"
              className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-4 text-center font-mono text-2xl uppercase tracking-[0.2em] outline-none focus:border-accent"
            />
            {roomError && <p className="mt-3 text-sm text-destructive">{roomError}</p>}
            <button
              type="submit"
              className="mt-5 w-full rounded-full bg-primary py-3.5 text-base font-medium text-primary-foreground hover:bg-primary/90"
            >
              Join room
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}

function ExercisePage({ room }: { room: string }) {
  const [name, setName] = useState("");
  const [step, setStep] = useState<Step>("weekly");
  const [weekly, setWeekly] = useState<WeeklyAllocation[]>(makeWeeklyAllocations);
  const [weeklySubmitting, setWeeklySubmitting] = useState(false);
  const [weeklyDelivery, setWeeklyDelivery] = useState<"idle" | "sent" | "failed">("idle");
  const [participantId, setParticipantId] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleWeeklySubmit = async () => {
    if (weeklyAllocationTotal(weekly) !== 100 || weeklySubmitting) return;
    setWeeklySubmitting(true);
    const id =
      participantId ||
      (typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
    if (!participantId) setParticipantId(id);
    try {
      const delivered = await broadcastWeeklySubmission(room, {
        participantId: id,
        name: name.trim() || undefined,
        allocations: weekly,
      });
      setWeeklyDelivery(delivered ? "sent" : "failed");
      setStep("weekly-result");
    } finally {
      setWeeklySubmitting(false);
    }
  };

  const handleFinish = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const { error } = await supabase.from("diagram_submissions").insert({
        name: name.trim() || null,
        email: email.trim() || null,
        current_diagram: JSON.parse(
          JSON.stringify({ exercise: "typical_week", allocations: weekly }),
        ),
        ideal_diagram: [],
      });
      if (error) throw error;
      setDone(true);
    } catch (err) {
      setError(getStorageErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background venn-bg">
      <main className="mx-auto max-w-2xl px-4 py-8 md:py-12">
        <header className="text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-accent">The Diagram</p>
          <h1 className="mt-2 font-serif text-3xl md:text-4xl text-foreground">
            Build your Harmony
          </h1>
          <p className="mt-3 text-sm md:text-base text-muted-foreground">
            {step === "weekly" && "Think about a typical week and divide all of your time."}
            {step === "weekly-result" && "Here is the shape of your typical week."}
          </p>
          {room && (
            <p className="mt-2 font-mono text-xs uppercase tracking-[0.14em] text-accent">
              Connected to room {room}
            </p>
          )}
        </header>

        {step === "weekly" && (
          <div className="mt-6 rounded-2xl border border-border bg-card/70 p-4">
            <label className="block text-sm font-medium text-foreground">
              Your name <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex"
              className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-base outline-none focus:border-accent"
            />
          </div>
        )}

        <div className="mt-6">
          {step === "weekly" && (
            <WeeklyAllocationForm
              allocations={weekly}
              onChange={setWeekly}
              onSubmit={handleWeeklySubmit}
              submitting={weeklySubmitting}
            />
          )}

          {step === "weekly-result" && (
            <div>
              {weeklyDelivery === "sent" && (
                <div className="mb-5 rounded-xl border border-secondary/50 bg-secondary/10 px-4 py-3 text-center text-sm text-foreground/80">
                  Your typical week was added to the room average.
                </div>
              )}
              {weeklyDelivery === "failed" && (
                <div className="mb-5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-center text-sm text-foreground/80">
                  Your chart is ready, but it could not reach the facilitator screen. Ask the
                  facilitator to keep the room open.
                  <button
                    type="button"
                    onClick={handleWeeklySubmit}
                    disabled={weeklySubmitting}
                    className="ml-2 font-medium text-destructive underline underline-offset-2 disabled:opacity-50"
                  >
                    {weeklySubmitting ? "Retrying…" : "Try again"}
                  </button>
                </div>
              )}
              <WeeklyPieChart allocations={weekly} />
              <div className="mt-8 rounded-2xl border border-border bg-card/70 p-6 text-center">
                {done ? (
                  <div>
                    <p className="font-serif text-2xl text-foreground">
                      Thank you for completing this.
                    </p>
                    <p className="mt-2 text-foreground/80">We appreciate you taking the time.</p>
                  </div>
                ) : (
                  <div>
                    <p className="font-serif text-xl text-foreground">
                      Thank you for completing this.
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Your typical week was added to the room average. If you would like updates
                      about future developments, leave your email below.
                    </p>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com (optional)"
                      className="mt-4 w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-accent"
                    />
                    {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
                    <button
                      onClick={handleFinish}
                      disabled={submitting}
                      className="mt-4 w-full rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                    >
                      {submitting ? "Saving…" : "Finish"}
                    </button>
                  </div>
                )}
              </div>
              {!done && (
                <button
                  type="button"
                  onClick={() => setStep("weekly")}
                  className="mt-4 w-full rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground hover:border-accent"
                >
                  Edit percentages
                </button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
