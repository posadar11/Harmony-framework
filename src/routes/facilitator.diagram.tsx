import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { DiagramBuilder, StaticDiagram } from "@/components/DiagramBuilder";
import { makeStartingDiagram, type DomainCircle } from "@/lib/diagram-types";

export const Route = createFileRoute("/facilitator/diagram")({
  head: () => ({
    meta: [
      { title: "The Diagram, Presenter workshop" },
      {
        name: "description",
        content:
          "A four-step presenter flow for The Diagram workshop: intro, current, ideal, and participant submission.",
      },
      { property: "og:title", content: "The Diagram, Presenter workshop" },
      {
        property: "og:description",
        content: "Walk the room through the Harmony of Relationships diagram, live.",
      },
    ],
  }),
  component: DiagramPresenter,
});

function DiagramPresenter() {
  const [step, setStep] = useState(0);
  const makeExerciseDiagram = () => makeStartingDiagram([]).filter((circle) => circle.label !== "Time for myself");
  const [current, setCurrent] = useState<DomainCircle[]>(makeExerciseDiagram);
  const [ideal, setIdeal] = useState<DomainCircle[]>(makeExerciseDiagram);
  const [compare, setCompare] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [joinUrl, setJoinUrl] = useState<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/join`;
    setJoinUrl(url);
    QRCode.toDataURL(url, { width: 720, margin: 2, color: { dark: "#2b2a26", light: "#ffffff" } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(""));
  }, []);

  const steps = ["Intro", "Current", "Ideal", "Submit"];

  const next = () => setStep((s) => Math.min(3, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-background overflow-hidden">
      <header className="flex items-center justify-between border-b border-border/60 px-6 py-3 text-sm">
        <Link to="/facilitator" className="text-muted-foreground hover:text-foreground">
          ← Exit
        </Link>
        <div className="flex items-center gap-2">
          {steps.map((label, i) => (
            <span
              key={label}
              className={`rounded-full px-3 py-1 text-xs ${
                i === step
                  ? "bg-primary text-primary-foreground"
                  : i < step
                    ? "text-foreground/70"
                    : "text-muted-foreground"
              }`}
            >
              {i + 1}. {label}
            </span>
          ))}
        </div>
        <span className="text-muted-foreground">
          {step + 1} / {steps.length}
        </span>
      </header>

      <main className="flex-1 overflow-y-auto">
        {step === 0 && <IntroSlide onStart={next} />}
        {step === 1 && (
          <BuilderSlide
            heading="Current"
            subheading="Build the diagram as it is today."
            circles={current}
            onChange={setCurrent}
          />
        )}
        {step === 2 && (
          <BuilderSlide
            heading="Ideal"
            subheading="Now shape the diagram as you want it to be."
            circles={ideal}
            onChange={setIdeal}
            compare={compare}
            onToggleCompare={() => setCompare((v) => !v)}
            currentForCompare={current}
          />
        )}
        {step === 3 && <SubmitSlide qrDataUrl={qrDataUrl} joinUrl={joinUrl} />}
      </main>

      <footer className="flex items-center justify-between border-t border-border/60 px-6 py-4">
        <button
          onClick={back}
          disabled={step === 0}
          className="rounded-full border border-border px-5 py-2.5 text-sm text-foreground/80 hover:border-accent disabled:opacity-40 disabled:hover:border-border"
        >
          ← Back
        </button>
        <button
          onClick={next}
          disabled={step === 3}
          className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
        >
          {step === 0 ? "Start →" : "Next →"}
        </button>
      </footer>
    </div>
  );
}

function IntroSlide({ onStart }: { onStart: () => void }) {
  return (
    <section className="mx-auto flex min-h-full max-w-4xl flex-col items-center justify-center px-8 py-16 text-center">
      <p className="text-xs uppercase tracking-[0.25em] text-accent">The Diagram</p>
      <h1 className="mt-4 font-serif text-5xl md:text-7xl text-foreground leading-[1.05]">
        The Harmony of Relationships
      </h1>
      <p className="mt-8 max-w-2xl text-lg md:text-xl text-foreground/80 leading-relaxed">
        Work-life balance is a myth, most of our time is spent working. The goal is
        <em> harmony</em> across the parts of life, not balance.
      </p>
      <div className="mt-8 grid gap-3 text-left text-foreground/80 max-w-xl">
        <p>
          <span className="font-medium text-foreground">Each life domain is a circle.</span> Its size
          shows how much of your time it takes.
        </p>
        <p>
          <span className="font-medium text-foreground">Overlaps are shared time,</span> the places
          where two parts of life happen together.
        </p>
        <p>
          <span className="font-medium text-foreground">Uncovered space is time for yourself,</span>{" "}
          the part that only belongs to you.
        </p>
      </div>
      <button
        onClick={onStart}
        className="mt-12 rounded-full bg-primary px-8 py-3.5 text-base font-medium text-primary-foreground hover:bg-primary/90"
      >
        Start
      </button>
    </section>
  );
}

function BuilderSlide({
  heading,
  subheading,
  circles,
  onChange,
  compare,
  onToggleCompare,
  currentForCompare,
}: {
  heading: string;
  subheading: string;
  circles: DomainCircle[];
  onChange: (c: DomainCircle[]) => void;
  compare?: boolean;
  onToggleCompare?: () => void;
  currentForCompare?: DomainCircle[];
}) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-accent">Step</p>
          <h2 className="mt-1 font-serif text-4xl md:text-5xl text-foreground">{heading}</h2>
          <p className="mt-2 text-muted-foreground">{subheading}</p>
        </div>
        {onToggleCompare && (
          <button
            onClick={onToggleCompare}
            className="rounded-full border border-border px-4 py-2 text-sm text-foreground/80 hover:border-accent"
          >
            {compare ? "Single view" : "Compare with Current"}
          </button>
        )}
      </div>

      {compare && currentForCompare ? (
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <StaticDiagram title="Current" circles={currentForCompare} showYou />
          <StaticDiagram title="Ideal" circles={circles} showYou />
        </div>
      ) : (
        <div className="mt-6">
          <DiagramBuilder circles={circles} onChange={onChange} showYou />
        </div>
      )}
    </section>
  );
}

function SubmitSlide({ qrDataUrl, joinUrl }: { qrDataUrl: string; joinUrl: string }) {
  return (
    <section className="mx-auto flex min-h-full max-w-4xl flex-col items-center justify-center px-8 py-12 text-center">
      <p className="text-xs uppercase tracking-[0.25em] text-accent">Your turn</p>
      <h2 className="mt-3 font-serif text-4xl md:text-6xl text-foreground">
        Build your own diagram
      </h2>
      <p className="mt-4 max-w-xl text-foreground/80">
        Scan the code, build your Current and Ideal, then submit to join the waitlist.
      </p>
      <div className="mt-8 rounded-3xl border border-border bg-white p-6 shadow-sm">
        {qrDataUrl ? (
          <img src={qrDataUrl} alt="Scan to open the participant form" className="h-72 w-72 md:h-96 md:w-96" />
        ) : (
          <div className="h-72 w-72 md:h-96 md:w-96 flex items-center justify-center text-muted-foreground">
            Generating QR…
          </div>
        )}
      </div>
      <p className="mt-5 select-all font-mono text-sm text-muted-foreground break-all">{joinUrl}</p>
    </section>
  );
}
