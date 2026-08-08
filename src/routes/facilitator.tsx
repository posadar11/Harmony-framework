import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { facilitatorAgenda, tracks } from "@/content/workshop";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { DiagramBuilder, StaticDiagram } from "@/components/DiagramBuilder";
import { TimeMultiplierSummary } from "@/components/TimeMultiplierSummary";
import { WeeklyPieChart } from "@/components/WeeklyPieChart";
import { CATEGORY_COLORS, type DomainCircle } from "@/lib/diagram-types";
import { createRoomCode } from "@/lib/live-room";
import { averageWeeklyAllocations, type WeeklySubmission } from "@/lib/weekly-allocation";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";

const makeOverlapDemo = (): DomainCircle[] => [
  {
    id: "demo-work",
    label: "Work",
    percent: 50,
    x: 0.5,
    y: 0.3465,
    enabled: true,
    color: CATEGORY_COLORS.Work,
  },
  {
    id: "demo-close",
    label: "Close relationships",
    percent: 50,
    x: 0.62,
    y: 0.16,
    enabled: true,
    color: CATEGORY_COLORS["Close relationships"],
  },
  {
    id: "demo-family",
    label: "Family",
    percent: 50,
    x: 0.84,
    y: 0.38,
    enabled: true,
    color: CATEGORY_COLORS.Family,
  },
  {
    id: "demo-community",
    label: "Community",
    percent: 50,
    x: 0.38,
    y: 0.84,
    enabled: true,
    color: CATEGORY_COLORS.Community,
  },
  {
    id: "demo-hobbies",
    label: "Hobbies",
    percent: 50,
    x: 0.16,
    y: 0.62,
    enabled: true,
    color: CATEGORY_COLORS.Hobbies,
  },
  {
    id: "demo-health",
    label: "Health",
    percent: 50,
    x: 0.7,
    y: 0.84,
    enabled: true,
    color: CATEGORY_COLORS.Health,
  },
];

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
      kind: "overlap";
      session: number;
      title: string;
      subtitle: string;
      body: string;
      source: string;
    }
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
  const [overlapDemo, setOverlapDemo] = useState<DomainCircle[]>(makeOverlapDemo);
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

  // Flow: room exercise → evidence → intentionality → live overlap demonstration → reflection.
  const slides: Slide[] = [];

  slides.push({
    kind: "qr",
    session: 0,
    title: "Map your typical week",
    subtitle: "Exercise 1 · Your turn",
    body: "Scan the permanent code, enter the room code, then divide a typical week into 100%.",
  });
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
    title: "Be intentional with the same 100%",
    subtitle: "The relationship lens",
    body: "Your week is finite, but the same hour can contribute to more than one relationship. The question is not only where time goes, but what—and who—that time serves.",
    chips: [
      { label: "Work", color: CATEGORY_COLORS.Work },
      { label: "Close relationships", color: CATEGORY_COLORS["Close relationships"] },
      { label: "Family", color: CATEGORY_COLORS.Family },
      { label: "Community", color: CATEGORY_COLORS.Community },
      { label: "Hobbies", color: CATEGORY_COLORS.Hobbies },
      { label: "Health", color: CATEGORY_COLORS.Health },
    ],
  });

  slides.push({
    kind: "scenario",
    session: 1,
    title: "Time can create more than one kind of value",
    subtitle: "The multiplier",
    body: "A conversation with a family member who is also a colleague can strengthen family and work at the same time. A walk with a friend can serve close relationships and health. Shared time does not create extra hours—it lets one hour contribute to more than one part of life.",
  });
  slides.push({
    kind: "overlap",
    session: 1,
    title: "Overlap multiplies value",
    subtitle: "Live overlap demonstration",
    body: "The average full-time American works 40 hours per week. After 7–8 hours of sleep each night, 112–119 waking hours remain, making work about one-third of your total waking time during the week.",
    source:
      "Sources: BLS American Time Use Survey; CDC/NIOSH analysis of ATUS. Full-time workers averaged 8.1 work hours and 7.8 sleep hours on workdays.",
  });
  slides.push({
    kind: "scenario",
    session: 2,
    title: "Which overlaps multiply what matters?",
    subtitle: "A question of intention",
    body: "Which relationships could be strengthened through time you already spend? Where could work, family, friendship, community, or hobbies support one another instead of competing for separate hours?",
  });
  slides.push({
    kind: "scenario",
    session: 2,
    title: "Not every overlap is healthy",
    subtitle: "Boundaries still matter",
    body: "An overlap can multiply meaning, or it can erase recovery. When work enters every family moment, the same mechanism becomes boundary erosion. Intentional overlap is chosen; unhealthy overlap feels unavoidable.",
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
      if ((e.target as HTMLElement | null)?.closest("input, button, a, textarea, select")) return;
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
    setOverlapDemo(makeOverlapDemo());
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
        <div
          className={`flex-1 flex justify-center px-12 overflow-y-auto ${
            s.kind === "overlap" ? "items-start" : "items-center"
          }`}
        >
          {s.kind === "overlap" ? (
            <div className="w-full max-w-7xl py-8">
              <div className="text-center">
                <p className="text-sm uppercase tracking-[0.25em] text-accent mb-3">{s.subtitle}</p>
                <h2 className="font-serif text-4xl md:text-5xl text-foreground">{s.title}</h2>
                <p className="mx-auto mt-4 max-w-3xl text-lg text-foreground/80 leading-relaxed">
                  {s.body}
                </p>
                <p className="mx-auto mt-2 max-w-3xl text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                  {s.source}
                </p>
              </div>
              <div className="mt-6 grid items-start gap-6 lg:grid-cols-[2fr_0.8fr]">
                <DiagramBuilder
                  circles={overlapDemo}
                  onChange={setOverlapDemo}
                  showYou
                  presentationMode
                  onResetPresentation={() => setOverlapDemo(makeOverlapDemo())}
                />
                <div className="lg:sticky lg:top-4">
                  <TimeMultiplierSummary circles={overlapDemo} />
                </div>
              </div>
            </div>
          ) : s.kind === "diagram" ? (
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
                        style={{ backgroundColor: c.color }}
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
            <button
              type="button"
              onClick={enterPresent}
              className="group rounded-2xl border border-border bg-card p-6 text-left hover:border-accent transition-colors"
            >
              <p className="text-xs uppercase tracking-[0.18em] text-accent">Workshop</p>
              <h3 className="mt-2 font-serif text-xl text-foreground">The Diagram</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                An 8-slide live flow: room exercise, average, boundary statistics, intentional
                overlap, and a dynamic time-multiplier demonstration.
              </p>
              <span className="mt-4 inline-block text-sm text-accent group-hover:underline">
                Open presenter →
              </span>
            </button>
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
