import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { DiagramBuilder, StaticDiagram } from "@/components/DiagramBuilder";
import { makeStartingDiagram, type DomainCircle } from "@/lib/diagram-types";
import { supabase } from "@/integrations/supabase/client";
import { broadcastSubmission } from "@/lib/live-room";

export const Route = createFileRoute("/join")({
  validateSearch: (search: Record<string, unknown>) => ({
    room: typeof search.room === "string" ? search.room.slice(0, 24) : "",
  }),
  head: () => ({
    meta: [
      { title: "Build your diagram, The Harmony of Relationships" },
      {
        name: "description",
        content: "Build your Ideal and Current diagrams and get instant insights.",
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

type Insights = {
  summary: string;
  suggestions: string[];
  questions: string[];
};

const getInsights = createServerFn({ method: "POST" })
  .validator((data: { current: DomainCircle[]; ideal: DomainCircle[] }) => data)
  .handler(async ({ data }): Promise<Insights> => {
    const { current, ideal } = data;
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return {
        summary:
          "Insights aren't turned on yet. Add an OPENAI_API_KEY environment variable on the server to enable AI-generated insights.",
        suggestions: [],
        questions: [],
      };
    }

    const idealByLabel = new Map(
      ideal.filter((c) => c.enabled).map((c) => [c.label, Math.round(c.percent)]),
    );
    const currentByLabel = new Map(
      current.filter((c) => c.enabled).map((c) => [c.label, Math.round(c.percent)]),
    );
    const labels = Array.from(new Set([...currentByLabel.keys(), ...idealByLabel.keys()]));

    const rows = labels
      .map((label) => {
        const cur = currentByLabel.get(label) ?? 0;
        const ide = idealByLabel.get(label) ?? 0;
        return { label, cur, ide, gap: ide - cur };
      })
      .sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap));

    const table = rows
      .map((r) => {
        if (r.gap === 0) return `${r.label}: current ${r.cur}%, ideal ${r.ide}% (no gap)`;
        const direction =
          r.gap > 0 ? `wants ${r.gap} pts MORE` : `wants ${Math.abs(r.gap)} pts LESS`;
        return `${r.label}: current ${r.cur}%, ideal ${r.ide}% (${direction})`;
      })
      .join("\n");

    const gappedRows = rows.filter((r) => r.gap !== 0);
    const allAligned = gappedRows.length === 0;
    const biggestGaps = gappedRows.slice(0, 2).map((r) => r.label);

    const prompt = `You are a sharp, perceptive life-balance coach. Avoid generic, boilerplate advice - be specific to these exact numbers.
A person rated how they currently spend their time and energy across life domains ("current") versus how they wish it were spent ("ideal"), as percentages of a whole.

${table}

${
  allAligned
    ? "Every domain matches between current and ideal - there is no numeric gap anywhere."
    : `The largest gaps are in: ${biggestGaps.join(" and ")}.`
}

Write a specific, perceptive 3-4 sentence summary. ${
      allAligned
        ? "Since there's no gap, don't invent one - instead comment on what an evenly-matched split like this really takes to sustain in a busy life, and gently question whether a perfectly even split might itself hide trade-offs worth noticing."
        : "Name the domain(s) with the biggest gap explicitly, state the size of the gap in points, and speculate concretely on a plausible real reason for that imbalance (for example a demanding work season, caregiving, or a recent life change) and the trade-off it likely forces."
    } Avoid vague phrases like "seek balance" or "room for growth" - write as if you actually studied these exact numbers.

Then give exactly 4 suggestions. Each must be one sentence, name a specific domain from the list above, ${
      allAligned ? "" : "reference its actual point gap, "
    }and describe one concrete action to try this week (a specific time block, a boundary to set, a habit, or a conversation to have) rather than generic encouragement. ${
      allAligned
        ? "Since there's no gap to close, make the suggestions about protecting and deepening the domains that matter most, and about periodically re-checking whether the split still feels right in practice."
        : ""
    }

Also include exactly 3 reflective questions as "homework" - questions the person should ask themselves to help close the gap (or, if aligned, to keep checking in with themselves). Each question should be specific to the domains and gap above, phrased in the second person ("Are you..." / "What would it take for you to..."), and genuinely thought-provoking rather than generic.\n\nRespond ONLY with JSON in this exact shape: {"summary": string, "suggestions": string[], "questions": string[]}`;

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.85,
          max_tokens: 700,
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI request failed with status ${response.status}`);
      }

      const json = await response.json();
      const raw = json?.choices?.[0]?.message?.content ?? "{}";
      const parsed = JSON.parse(raw);

      return {
        summary: typeof parsed.summary === "string" ? parsed.summary : "",
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 5) : [],
        questions: Array.isArray(parsed.questions) ? parsed.questions.slice(0, 5) : [],
      };
    } catch (err) {
      console.error("[insights] LLM call failed", err);
      return {
        summary:
          "We couldn't generate personalized insights right now, but your comparison is ready below.",
        suggestions: [],
        questions: [],
      };
    }
  });

type Step = "ideal" | "current" | "loading" | "results";

function JoinPage() {
  const { room } = Route.useSearch();
  const [name, setName] = useState("");
  const [step, setStep] = useState<Step>("ideal");

  const makeExerciseDiagram = () =>
    makeStartingDiagram().filter((circle) => circle.label !== "Time for myself");

  const [ideal, setIdeal] = useState<DomainCircle[]>(() => makeExerciseDiagram());
  const [current, setCurrent] = useState<DomainCircle[]>(() => makeExerciseDiagram());

  const [insights, setInsights] = useState<Insights | null>(null);

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGetInsights = async () => {
    setStep("loading");
    try {
      const { error: saveError } = await supabase.from("diagram_submissions").insert({
        name: name.trim() || null,
        email: email.trim() || null,
        current_diagram: JSON.parse(JSON.stringify(current)),
        ideal_diagram: JSON.parse(JSON.stringify(ideal)),
      });
      if (saveError) throw saveError;
      setSaved(true);
      await broadcastSubmission(room, { current, ideal });

      const result = await getInsights({ data: { current, ideal } });
      setInsights(result);
    } catch (err) {
      setInsights({
        summary:
          "We couldn't generate personalized insights right now, but your comparison is ready below.",
        suggestions: [],
        questions: [],
      });
    } finally {
      setStep("results");
    }
  };

  const handleFinish = async () => {
    if (saved) {
      setDone(true);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const { error } = await supabase.from("diagram_submissions").insert({
        name: name.trim() || null,
        email: email.trim() || null,
        current_diagram: JSON.parse(JSON.stringify(current)),
        ideal_diagram: JSON.parse(JSON.stringify(ideal)),
      });
      if (error) throw error;
      setDone(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setError(msg);
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
            {step === "ideal" && "First, shape the diagram for how you want life to be."}
            {step === "current" && "Now, shape the diagram for how life is right now."}
            {step === "loading" && "Comparing your Ideal and Current balance..."}
            {step === "results" && "Here's how your Current and Ideal compare."}
          </p>
        </header>

        {(step === "ideal" || step === "current") && (
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
            <label className="mt-4 block text-sm font-medium text-foreground">
              Your email <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-base outline-none focus:border-accent"
            />
          </div>
        )}

        <div className="mt-6">
          {step === "ideal" && (
            <div>
              <h2 className="font-serif text-xl text-foreground text-center mb-3">
                Step 1 of 2 — Ideal
              </h2>
              <DiagramBuilder circles={ideal} onChange={setIdeal} showYou />
              <div className="sticky bottom-4 mt-8">
                <button
                  onClick={() => setStep("current")}
                  className="w-full rounded-full bg-primary py-4 text-base font-medium text-primary-foreground shadow-lg hover:bg-primary/90"
                >
                  Continue to Current
                </button>
              </div>
            </div>
          )}

          {step === "current" && (
            <div>
              <h2 className="font-serif text-xl text-foreground text-center mb-3">
                Step 2 of 2 — Current
              </h2>
              <DiagramBuilder circles={current} onChange={setCurrent} showYou />
              <div className="sticky bottom-4 mt-8">
                <button
                  onClick={handleGetInsights}
                  className="w-full rounded-full bg-primary py-4 text-base font-medium text-primary-foreground shadow-lg hover:bg-primary/90"
                >
                  Submit
                </button>
              </div>
            </div>
          )}

          {step === "loading" && (
            <div className="py-20 text-center text-muted-foreground">
              <p>Generating your insights…</p>
            </div>
          )}

          {step === "results" && (
            <div>
              <div className="grid gap-5 md:grid-cols-2">
                <StaticDiagram title="Ideal" circles={ideal} showYou />
                <StaticDiagram title="Current" circles={current} showYou />
              </div>

              {insights && (
                <div className="mt-6 rounded-2xl border border-border bg-card/70 p-5">
                  <h3 className="font-serif text-lg text-foreground">Insights</h3>
                  <p className="mt-2 text-sm text-foreground/80">{insights.summary}</p>
                  {insights.suggestions.length > 0 && (
                    <ul className="mt-4 space-y-2">
                      {insights.suggestions.map((s, i) => (
                        <li key={i} className="text-sm text-foreground/80 flex gap-2">
                          <span className="text-accent">•</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {insights.questions.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-foreground/90">
                        Questions to sit with
                      </h4>
                      <ul className="mt-2 space-y-2">
                        {insights.questions.map((q, i) => (
                          <li key={i} className="text-sm text-foreground/80 flex gap-2">
                            <span className="text-accent">?</span>
                            <span>{q}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

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
                      Your diagrams were added to the room average when you pressed Submit.
                    </p>
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
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
