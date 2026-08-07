import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { facilitatorAgenda, tracks } from "@/content/workshop";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { StaticDiagram } from "@/components/DiagramBuilder";
import { WeeklyPieChart } from "@/components/WeeklyPieChart";
import { type DomainCircle } from "@/lib/diagram-types";
import { createRoomCode } from "@/lib/live-room";
import { averageWeeklyAllocations, type WeeklySubmission } from "@/lib/weekly-allocation";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/facilitator")({
  head: () => ({
    meta: [
      { title: "Facilitator Mode, The Harmony of Relationships" },
      {
        name: "description",
        content:
          "Agenda, scenarios, and presenter view for facilitators running The Harmony of Relationships workshop.",
      },
      { property: "og:title", content: "Facilitator Mode, The Harmony of Relationships" },
      {
        property: "og:description",
        content: "Run the 3-session workshop with agenda, scenarios, and present mode.",
      },
    ],
  }),
  component: FacilitatorPage,
});

type StatItem = { value: string; label: string; source: string };
type Highlight = { value: string; label: string };
type Slide =
  | { kind: "title"; session: number; title: string; subtitle: string; body: string }
  | { kind: "scenario"; session: number; title: string; subtitle: string; body: string }
  | { kind: "exercise"; session: number; title: string; subtitle: string; body: string }
  | {
      kind: "diagram";
      session: number;
      title: string;
      subtitle: string;
      body: string;
      circles: DomainCircle[];
      compareCircles?: DomainCircle[];
    }
  | {
      kind: "intro";
      session: number;
      title: string;
      subtitle: string;
      body: string;
      chips: { label: string; color: string }[];
    }
  | { kind: "stats"; session: number; title: string; subtitle: string; stats: StatItem[] }
  | {
      kind: "statement";
      session: number;
      title: string;
      subtitle: string;
      body: string;
      highlights: Highlight[];
      footnote: string;
    }
  | {
      kind: "framework";
      session: number;
      title: string;
      subtitle: string;
      lead: string;
      emphasis: string;
      tail: string;
      parties: { label: string; note: string }[];
    }
  | { kind: "qr"; session: number; title: string; subtitle: string; body: string };

function FacilitatorPage() {
  const [presenting, setPresenting] = useState(false);
  const [slide, setSlide] = useState(0);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [joinUrl, setJoinUrl] = useState<string>("");
  const [roomCode, setRoomCode] = useState("");
  const [weeklySubmissions, setWeeklySubmissions] = useState<WeeklySubmission[]>([]);
  const [showRoomAverage, setShowRoomAverage] = useState(false);
  const [liveConnectionError, setLiveConnectionError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedRoom = window.localStorage.getItem("hor.facilitator.room");
    const room = savedRoom || createRoomCode();
    window.localStorage.setItem("hor.facilitator.room", room);
    setRoomCode(room);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/join`;
    setJoinUrl(url);
    QRCode.toDataURL(url, { width: 720, margin: 2, color: { dark: "#2b2a26", light: "#ffffff" } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(""));
  }, []);

  useEffect(() => {
    if (!roomCode || typeof window === "undefined") return;
    const weeklyStorageKey = `hor.room.${roomCode}.weekly`;
    try {
      const savedWeekly = window.localStorage.getItem(weeklyStorageKey);
      setWeeklySubmissions(savedWeekly ? (JSON.parse(savedWeekly) as WeeklySubmission[]) : []);
    } catch {
      setWeeklySubmissions([]);
    }

    if (!isSupabaseConfigured()) return;

    setLiveConnectionError(null);
    let channel;
    try {
      channel = supabase
        .channel(`harmony-room-${roomCode}`)
        .on("broadcast", { event: "weekly-submitted" }, ({ payload }) => {
          setWeeklySubmissions((existing) => {
            const submission = payload as WeeklySubmission;
            const previousIndex = existing.findIndex(
              (item) => item.participantId === submission.participantId,
            );
            const next =
              previousIndex === -1
                ? [...existing, submission]
                : existing.map((item, index) => (index === previousIndex ? submission : item));
            window.localStorage.setItem(weeklyStorageKey, JSON.stringify(next));
            return next;
          });
        })
        .subscribe((status) => {
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            setLiveConnectionError("The live room connection could not be established.");
          }
        });
    } catch (error) {
      console.error("[live-room] Failed to start facilitator subscription", error);
      setLiveConnectionError("The live room connection could not be established.");
      return;
    }

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [roomCode]);

  const startNewRoom = () => {
    const room = createRoomCode();
    window.localStorage.setItem("hor.facilitator.room", room);
    setRoomCode(room);
    setWeeklySubmissions([]);
    setShowRoomAverage(false);
  };

  // Sample diagrams used to illustrate the concept during presentation.
  // Current: Work receives most of the allocation; other domains are smaller and isolated.
  const currentSample: DomainCircle[] = [
    { id: "s-wk", label: "Work", percent: 60, x: 0.56, y: 0.56, enabled: true, color: "#7BA7C5" },
    {
      id: "s-cr",
      label: "Close relationships",
      percent: 10,
      x: 0.76,
      y: 0.26,
      enabled: true,
      color: "#C58F8F",
    },
    { id: "s-fm", label: "Family", percent: 15, x: 0.24, y: 0.74, enabled: true, color: "#B8A05E" },
    {
      id: "s-cm",
      label: "Community",
      percent: 5,
      x: 0.24,
      y: 0.32,
      enabled: true,
      color: "#8FA98A",
    },
    {
      id: "s-hb",
      label: "Hobbies",
      percent: 10,
      x: 0.74,
      y: 0.72,
      enabled: true,
      color: "#B592C1",
    },
  ];

  // Ideal: Time is distributed more evenly, with real overlap between domains.
  const idealSample: DomainCircle[] = [
    { id: "i-wk", label: "Work", percent: 35, x: 0.6, y: 0.6, enabled: true, color: "#7BA7C5" },
    {
      id: "i-cr",
      label: "Close relationships",
      percent: 20,
      x: 0.7,
      y: 0.3,
      enabled: true,
      color: "#C58F8F",
    },
    { id: "i-fm", label: "Family", percent: 20, x: 0.3, y: 0.3, enabled: true, color: "#B8A05E" },
    {
      id: "i-cm",
      label: "Community",
      percent: 10,
      x: 0.3,
      y: 0.7,
      enabled: true,
      color: "#8FA98A",
    },
    { id: "i-hb", label: "Hobbies", percent: 15, x: 0.7, y: 0.7, enabled: true, color: "#B592C1" },
  ];

  // Flow: framework intro → current vs ideal → QR → then the reflection questions.
  const slides: Slide[] = [];

  // Set up the problem before introducing the framework.
  slides.push({
    kind: "statement",
    session: 0,
    title: "Work-life balance does not exist",
    subtitle: "The caution",
    body: "60% of US workers report having no clear boundaries between their work responsibilities and their personal lives.",
    highlights: [
      { value: "54%", label: "check work email on vacation" },
      { value: "28%", label: "are asked to work during time off" },
      { value: "72%", label: "burnout among remote workers" },
    ],
    footnote:
      "Source: SurveyMonkey, Work-Life Balance Statistics. The determining factor is boundary erosion, not workload.",
  });
  slides.push({
    kind: "intro",
    session: 0,
    title: "The framework",
    subtitle: "How the diagram works",
    body: "Every diagram begins with one circle. Your time, your energy, your attention. Every relationship is a circle that overlaps this one.",
    chips: [
      { label: "Work", color: "#7BA7C5" },
      { label: "Close relationships", color: "#C58F8F" },
      { label: "Family", color: "#B8A05E" },
      { label: "Community", color: "#8FA98A" },
      { label: "Hobbies", color: "#B592C1" },
    ],
  });

  slides.push({
    kind: "diagram",
    session: 0,
    title: "Current vs Ideal",
    subtitle: "See the gap",
    body: "Compare life as it is today against the shape you want. The gap between the two is where harmony work happens.",
    circles: idealSample,
    compareCircles: currentSample,
  });
  slides.push({
    kind: "qr",
    session: 0,
    title: "Map your typical week",
    subtitle: "Your turn",
    body: "Scan the permanent code, enter the room code, then divide a typical week into 100%.",
  });

  // Four focused prompt slides: Current aspects, Ideal aspects,
  // Renegotiation, and the Commitment.
  slides.push({
    kind: "scenario",
    session: 1,
    title: "Your Current",
    subtitle: "Aspects to consider",
    body: "Think about a recent week. Where did your time and attention actually go? What obligations, habits, and unspoken agreements shape each circle today? Which circles grew because you chose them, and which grew because no one stopped them?",
  });
  slides.push({
    kind: "scenario",
    session: 2,
    title: "Your Ideal",
    subtitle: "What you would move",
    body: "Now picture the shape you actually want. Which circles need more overlap with you? Which need less? Where do you want space that belongs only to you? Draw it exactly as you want it, not as you think it should be.",
  });
  slides.push({
    kind: "scenario",
    session: 3,
    title: "The renegotiation",
    subtitle: "From Current to Ideal",
    body: "Between your Current and your Ideal there is a gap. Every gap has a name: a person, an agreement, a habit. What would you need to say, and to whom, for one circle to move? What is the ideal you are moving toward, and for what reason?",
  });
  slides.push({
    kind: "exercise",
    session: 3,
    title: "Your Commitment",
    subtitle: "One shift, this month",
    body: "Write one sentence: what you will do, with whom, by when. Small enough to actually happen. Clear enough that you will know when it is done.",
  });

  useEffect(() => {
    if (!presenting) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ")
        setSlide((i) => Math.min(slides.length - 1, i + 1));
      else if (e.key === "ArrowLeft") setSlide((i) => Math.max(0, i - 1));
      else if (e.key === "Escape") {
        setPresenting(false);
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [presenting, slides.length]);

  const enterPresent = async () => {
    setSlide(0);
    setPresenting(true);
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      /* ignore */
    }
  };

  if (presenting) {
    const s = slides[slide];
    return (
      <div className="fixed inset-0 z-50 bg-background venn-bg flex flex-col">
        <div className="flex items-center justify-between px-8 py-4 text-sm text-muted-foreground">
          <span>{s.session > 0 ? `Session ${s.session} · ${s.kind}` : s.kind}</span>
          <span>
            {slide + 1} / {slides.length}
          </span>
          <button
            onClick={() => {
              setPresenting(false);
              if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
            }}
            className="rounded-full border border-border px-3 py-1 hover:border-accent"
          >
            Exit (Esc)
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center px-12 overflow-y-auto">
          {s.kind === "diagram" ? (
            <div className="w-full max-w-6xl">
              <div className="text-center">
                <p className="text-sm uppercase tracking-[0.25em] text-accent mb-3">{s.subtitle}</p>
                <h2 className="font-serif text-4xl md:text-5xl text-foreground">{s.title}</h2>
                <p className="mx-auto mt-4 max-w-3xl text-lg md:text-xl text-foreground/80 leading-relaxed">
                  {s.body}
                </p>
              </div>
              <div
                className={`mt-8 grid gap-6 ${s.compareCircles ? "md:grid-cols-2" : "md:grid-cols-1 max-w-xl mx-auto"}`}
              >
                {s.compareCircles && (
                  <StaticDiagram title="Current" circles={s.compareCircles} showYou />
                )}

                <StaticDiagram
                  title={s.compareCircles ? "Ideal" : ""}
                  circles={s.circles}
                  showYou
                />
              </div>
            </div>
          ) : s.kind === "qr" ? (
            <div className="w-full max-w-6xl text-center">
              <p className="text-sm uppercase tracking-[0.25em] text-accent mb-4">{s.subtitle}</p>
              {showRoomAverage ? (
                <RoomAverage
                  weeklySubmissions={weeklySubmissions}
                  roomCode={roomCode}
                  connectionError={liveConnectionError}
                />
              ) : (
                <>
                  <h2 className="font-serif text-5xl md:text-6xl text-foreground">{s.title}</h2>
                  <p className="mx-auto mt-4 max-w-xl text-lg text-foreground/80">{s.body}</p>
                  <button
                    onClick={() => {
                      setPresenting(false);
                      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
                      window.location.href = joinUrl;
                    }}
                    className="mt-8 rounded-3xl border border-border bg-white p-6 shadow-sm hover:border-accent transition-colors"
                    aria-label="Open the participant exercise"
                  >
                    {qrDataUrl ? (
                      <img
                        src={qrDataUrl}
                        alt="Scan to open the exercise"
                        className="h-72 w-72 md:h-80 md:w-80"
                      />
                    ) : (
                      <div className="h-72 w-72 md:h-80 md:w-80 flex items-center justify-center text-muted-foreground">
                        Generating QR…
                      </div>
                    )}
                  </button>
                  <div className="mx-auto mt-5 max-w-md rounded-2xl border border-accent/40 bg-card/70 px-6 py-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      Enter this room code
                    </p>
                    <p className="mt-2 font-mono text-4xl font-semibold tracking-[0.2em] text-foreground">
                      {roomCode}
                    </p>
                  </div>
                  <p className="mt-2 select-all font-mono text-xs text-muted-foreground break-all">
                    {joinUrl}
                  </p>
                </>
              )}
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <button
                  onClick={() => setShowRoomAverage((visible) => !visible)}
                  className="rounded-full bg-primary px-5 py-2 text-primary-foreground"
                >
                  {showRoomAverage
                    ? "Show QR code"
                    : `Show room average (${weeklySubmissions.length})`}
                </button>
                <button
                  onClick={startNewRoom}
                  className="rounded-full border border-border px-5 py-2 text-foreground/80 hover:border-accent"
                >
                  Start a new room
                </button>
                {qrDataUrl && (
                  <a
                    href={qrDataUrl}
                    download="harmony-permanent-qr.png"
                    className="rounded-full border border-border px-5 py-2 text-foreground/80 hover:border-accent"
                  >
                    Download QR for PowerPoint
                  </a>
                )}
              </div>
              {liveConnectionError && (
                <p className="mt-3 text-sm text-destructive">{liveConnectionError}</p>
              )}
            </div>
          ) : s.kind === "stats" ? (
            <div className="w-full max-w-6xl">
              <div className="text-center">
                <p className="text-sm uppercase tracking-[0.25em] text-accent mb-3">{s.subtitle}</p>
                <h2 className="font-serif text-4xl md:text-5xl text-foreground leading-tight">
                  {s.title}
                </h2>
              </div>
              <div className="mt-12 grid gap-6 md:grid-cols-2">
                {s.stats.map((st) => (
                  <div
                    key={st.value + st.source}
                    className="rounded-2xl border border-border bg-card/60 p-8"
                  >
                    <div className="font-serif text-7xl md:text-8xl text-foreground leading-none tracking-tight">
                      {st.value}
                    </div>
                    <p className="mt-4 text-lg text-foreground/85 leading-snug">{st.label}</p>
                    <p className="mt-4 text-xs uppercase tracking-[0.15em] text-muted-foreground">
                      {st.source}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : s.kind === "statement" ? (
            <div className="w-full max-w-5xl text-center">
              <p className="text-sm uppercase tracking-[0.25em] text-accent mb-6">{s.subtitle}</p>
              <h2 className="font-serif text-5xl md:text-7xl text-foreground leading-[1.05]">
                {s.title}
              </h2>
              <p className="mx-auto mt-10 max-w-3xl text-2xl md:text-3xl text-foreground/85 leading-relaxed font-serif italic">
                {s.body}
              </p>
              <div className="mx-auto mt-14 grid max-w-4xl gap-6 md:grid-cols-3">
                {s.highlights.map((h) => (
                  <div
                    key={h.value + h.label}
                    className="rounded-2xl border border-border bg-card/60 p-6"
                  >
                    <div className="font-serif text-6xl md:text-7xl text-accent leading-none tracking-tight">
                      {h.value}
                    </div>
                    <p className="mt-3 text-sm md:text-base text-foreground/80 leading-snug">
                      {h.label}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mx-auto mt-8 max-w-3xl text-xs uppercase tracking-[0.15em] text-muted-foreground">
                {s.footnote}
              </p>
            </div>
          ) : s.kind === "framework" ? (
            <div className="w-full max-w-5xl text-center">
              <p className="text-sm uppercase tracking-[0.25em] text-accent mb-6">{s.subtitle}</p>
              <h2 className="font-serif text-5xl md:text-7xl text-foreground leading-[1.05]">
                {s.title}
              </h2>
              <p className="mx-auto mt-10 max-w-3xl text-xl md:text-2xl text-foreground/85 leading-relaxed">
                {s.lead}{" "}
                <em className="italic text-foreground not-italic-fallback">{s.emphasis}</em>{" "}
                {s.tail}
              </p>
              <div className="mt-14 grid gap-4 md:grid-cols-4">
                {s.parties.map((p) => (
                  <div
                    key={p.label}
                    className="rounded-2xl border border-border bg-card/50 px-4 py-6"
                  >
                    <div className="font-serif text-2xl text-foreground">{p.label}</div>
                    <p className="mt-2 text-xs uppercase tracking-[0.15em] text-muted-foreground">
                      {p.note}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : s.kind === "intro" ? (
            <div className="w-full max-w-6xl">
              <div className="text-center">
                <p className="text-sm uppercase tracking-[0.25em] text-accent mb-3">{s.subtitle}</p>
                <h2 className="font-serif text-4xl md:text-5xl text-foreground">{s.title}</h2>
                <p className="mx-auto mt-4 max-w-3xl text-lg md:text-xl text-foreground/80 leading-relaxed">
                  {s.body}
                </p>
              </div>
              <div className="mt-10 grid gap-10 md:grid-cols-[1fr_1fr] items-center">
                <div className="max-w-md mx-auto w-full">
                  <StaticDiagram title="" circles={[]} showYou />
                </div>
                <ul className="space-y-3">
                  {s.chips.map((c) => (
                    <li
                      key={c.label}
                      className="flex items-center gap-4 rounded-2xl border border-border bg-card/60 px-5 py-4"
                    >
                      <span
                        className="inline-block h-6 w-6 rounded-full border border-foreground/20"
                        style={{ backgroundColor: c.color, opacity: 0.7 }}
                      />
                      <span className="font-serif text-xl text-foreground">{c.label}</span>
                      <span className="ml-auto text-xs uppercase tracking-[0.15em] text-muted-foreground">
                        overlaps You
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="max-w-5xl text-center">
              <p className="text-sm uppercase tracking-[0.25em] text-accent mb-6">{s.subtitle}</p>
              <h2 className="font-serif text-5xl md:text-7xl text-foreground leading-[1.05]">
                {s.title}
              </h2>
              <p className="mt-10 text-2xl md:text-3xl text-foreground/85 leading-relaxed font-serif italic">
                {s.body}
              </p>
            </div>
          )}
        </div>
        <div className="flex items-center justify-center gap-4 pb-10">
          <button
            onClick={() => setSlide((i) => Math.max(0, i - 1))}
            className="rounded-full border border-border px-5 py-2 text-foreground/80 hover:border-accent"
          >
            ← Prev
          </button>
          <button
            onClick={() => setSlide((i) => Math.min(slides.length - 1, i + 1))}
            className="rounded-full bg-primary text-primary-foreground px-5 py-2"
          >
            Next →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-5 py-12 md:py-16">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-accent">Facilitator</p>
            <h1 className="mt-2 font-serif text-4xl md:text-5xl text-foreground">
              Run the workshop
            </h1>
            <p className="mt-3 max-w-2xl text-muted-foreground leading-relaxed">
              Suggested agenda, scenarios, and a present mode for projecting prompts to the room.
            </p>
          </div>
          <button
            onClick={enterPresent}
            className="rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Enter Present mode
          </button>
        </div>

        <section className="mt-12">
          <h2 className="font-serif text-2xl text-foreground">Sessions</h2>
          <p className="mt-2 text-muted-foreground">
            Live presenter flows you can run from a big screen.
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Link
              to="/facilitator/diagram"
              className="group rounded-2xl border border-border bg-card p-6 hover:border-accent transition-colors"
            >
              <p className="text-xs uppercase tracking-[0.18em] text-accent">Workshop</p>
              <h3 className="mt-2 font-serif text-xl text-foreground">The Diagram</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                A 4-step live flow: intro, build the Current diagram, build the Ideal, then a QR
                code for participants to submit their own.
              </p>
              <span className="mt-4 inline-block text-sm text-accent group-hover:underline">
                Open presenter →
              </span>
            </Link>
          </div>
        </section>

        <section className="mt-12 space-y-8">
          {facilitatorAgenda.map((a) => (
            <article key={a.session} className="rounded-2xl border border-border bg-card p-6">
              <p className="text-xs uppercase tracking-[0.15em] text-accent">Session {a.session}</p>
              <h2 className="mt-1 font-serif text-2xl text-foreground">{a.title}</h2>
              <ul className="mt-4 divide-y divide-border/60">
                {a.blocks.map((b) => (
                  <li key={b.time} className="flex items-baseline gap-4 py-2.5">
                    <span className="w-28 shrink-0 text-sm font-mono text-muted-foreground">
                      {b.time}
                    </span>
                    <span className="text-foreground/85">{b.label}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>

        <section className="mt-12">
          <h2 className="font-serif text-2xl text-foreground">Session 3, choose a track</h2>
          <p className="mt-2 text-muted-foreground">
            Pick the track that best fits the room, or weave elements from each.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {tracks.map((t) => (
              <article key={t.id} className="rounded-2xl border border-border bg-card p-5">
                <h3 className="font-serif text-lg text-foreground">{t.title}</h3>
                <p className="mt-2 text-sm italic text-foreground/80">"{t.question}"</p>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{t.body}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function RoomAverage({
  weeklySubmissions,
  roomCode,
  connectionError,
}: {
  weeklySubmissions: WeeklySubmission[];
  roomCode: string;
  connectionError: string | null;
}) {
  const weeklyAverage = averageWeeklyAllocations(weeklySubmissions);
  const liveConnectionAvailable = isSupabaseConfigured();

  return (
    <div>
      <h2 className="font-serif text-4xl md:text-5xl text-foreground">Typical week room average</h2>
      <p className="mt-3 text-lg text-foreground/80">
        {weeklySubmissions.length} {weeklySubmissions.length === 1 ? "participant" : "participants"}
        {" submitted · Room "}
        {roomCode}
      </p>
      {!liveConnectionAvailable && (
        <div className="mx-auto mt-5 max-w-2xl rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-3 text-sm text-foreground/80">
          Live collection is not connected yet. Add VITE_SUPABASE_URL and
          VITE_SUPABASE_PUBLISHABLE_KEY to Railway, then redeploy.
        </div>
      )}
      {connectionError && (
        <div className="mx-auto mt-5 max-w-2xl rounded-xl border border-destructive/30 bg-destructive/10 px-5 py-3 text-sm text-foreground/80">
          {connectionError} Refresh the page or start a new room to retry.
        </div>
      )}
      {weeklySubmissions.length === 0 ? (
        <div className="mx-auto mt-12 max-w-xl rounded-2xl border border-border bg-card/60 p-10 text-muted-foreground">
          Waiting for participants to submit their typical week…
        </div>
      ) : (
        <div className="mx-auto mt-8 max-w-4xl text-left">
          <WeeklyPieChart
            allocations={weeklyAverage}
            title="The room's typical week"
            subtitle="The average percentage reported across everyone who submitted."
            compact
          />
        </div>
      )}
    </div>
  );
}
