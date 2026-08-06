import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { DiagramBuilder, StaticDiagram } from "@/components/DiagramBuilder";
import { makeStartingDiagram, type DomainCircle } from "@/lib/diagram-types";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/join")({
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
};

const getInsights = createServerFn({ method: "POST" })
  .validator((data: { current: DomainCircle[]; ideal: DomainCircle[] }) => data)
  .handler(async ({ data }): Promise<Insights> => {
    const { current, ideal } = data;
    const apiKey = process.env.OPENAI_API_KEY;

    const describe = (circles: DomainCircle[]) =>
      circles
        .filter((c) => c.enabled)
        .map((c) => `${c.label}: ${Math.round(c.percent)}%`)
        .join(", ");

    if (!apiKey) {
      return {
        summary:
          "Insights aren't turned on yet. Add an OPENAI_API_KEY environment variable on the server to enable AI-generated insights.",
        suggestions: [],
      };
    }

    const prompt = `You are a warm, encouraging life-balance coach reviewing someone's self-assessment.

They mapped how their time and energy is distributed across life domains today ("Current"), and how they wish it were distributed ("Ideal"). Each domain has a relative percentage.

Current: ${describe(current)}
Ideal: ${describe(ideal)}

In 2-3 short sentences, summarize the biggest gaps between Current and Ideal. Then give exactly 3 short, concrete, actionable suggestions (one sentence each) for closing the gap. Respond ONLY with JSON in this shape: {"summary": string, "suggestions": string[]}`;

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
          temperature: 0.7,
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
      };
    } catch (err) {
      console.error("[insights] LLM call failed", err);
      return {
        summary: "We couldn't generate personalized insights right now, but your comparison is ready below.",
        suggestions: [],
      };
    }
  });

type Step = "ideal" | "current" | "loading" | "results";

function JoinPage() {
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
  const [error, setError] = useState<string | null>(null);

  const handleGetInsights = async () => {
    setStep("loading");
    try {
      const result = await getInsights({ data: { current, ideal } });
      setInsights(result);
    } catch (err) {
      setInsights({
        summary:
          "We couldn't generate personalized insights right now, but your comparison is ready below.",
        suggestions: [],
      });
    } finally {
      setStep("results");
    }
  };

  const handleFinish = async () => {
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
          <h1 className="mt-2 font-serif text-3xl md:text-4xl text-foreground">Build your Harmony</h1>
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
          </div>
        )}

        <div className="mt-6">
          {step === "ideal" && (
            <div>
              <h2 className="font-serif text-xl text-foreground text-center mb-3">Step 1 of 2 — Ideal</h2>
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
              <h2 className="font-serif text-xl text-foreground text-center mb-3">Step 2 of 2 — Current</h2>
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
                </div>
              )}

              <div className="mt-8 rounded-2xl border border-border bg-card/70 p-6 text-center">
                {done ? (
                  <div>
                    <p className="font-serif text-2xl text-foreground">Thank you for completing this.</p>
                    <p className="mt-2 text-foreground/80">We appreciate you taking the time.</p>
                  </div>
                ) : (
                  <div>
                    <p className="font-serif text-xl text-foreground">Thank you for completing this.</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Want something curated for you, and to hear about future developments? Leave your
                      email below.
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
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
