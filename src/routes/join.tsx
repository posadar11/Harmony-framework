import { createFileRoute } from "@tanstack/react-router";
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
        content: "Build your Current and Ideal diagrams and join the waitlist.",
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

type Tab = "current" | "ideal" | "compare";

function JoinPage() {
  const [name, setName] = useState("");
  const [tab, setTab] = useState<Tab>("current");
  const makeExerciseDiagram = () => makeStartingDiagram([]).filter((circle) => circle.label !== "Time for myself");
  const [current, setCurrent] = useState<DomainCircle[]>(makeExerciseDiagram);
  const [ideal, setIdeal] = useState<DomainCircle[]>(makeExerciseDiagram);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalName, setModalName] = useState("");
  const [modalEmail, setModalEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openModal = () => {
    setModalName(name);
    setModalOpen(true);
  };

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const { error } = await supabase.from("diagram_submissions").insert({
        name: modalName.trim() || null,
        email: modalEmail.trim() || null,
        current_diagram: JSON.parse(JSON.stringify(current)),
        ideal_diagram: JSON.parse(JSON.stringify(ideal)),
      });
      if (error) throw error;
      setDone(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong.";
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
            Shape a diagram for how life is now, and one for how you want it to be.
          </p>
        </header>

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

        <div className="sticky top-0 z-10 mt-6 -mx-4 px-4 py-2 bg-background/85 backdrop-blur">
          <div className="inline-flex w-full rounded-full border border-border bg-card p-1 text-sm">
            {(["current", "ideal", "compare"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 rounded-full px-3 py-2 capitalize transition-colors ${
                  tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          {tab === "current" && <DiagramBuilder circles={current} onChange={setCurrent} showYou />}
          {tab === "ideal" && <DiagramBuilder circles={ideal} onChange={setIdeal} showYou />}
          {tab === "compare" && (
            <div className="grid gap-5 md:grid-cols-2">
              <StaticDiagram title="Current" circles={current} showYou />
              <StaticDiagram title="Ideal" circles={ideal} showYou />
            </div>
          )}
        </div>

        <div className="sticky bottom-4 mt-8">
          <button
            onClick={openModal}
            className="w-full rounded-full bg-primary py-4 text-base font-medium text-primary-foreground shadow-lg hover:bg-primary/90"
          >
            Submit
          </button>
        </div>
      </main>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl">
            {done ? (
              <div className="text-center py-6">
                <h2 className="font-serif text-2xl text-foreground">Thank you.</h2>
                <p className="mt-3 text-foreground/80">You are on the waitlist.</p>
                <button
                  onClick={() => {
                    setModalOpen(false);
                    setDone(false);
                  }}
                  className="mt-6 rounded-full border border-border px-5 py-2 text-sm hover:border-accent"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <h2 className="font-serif text-xl md:text-2xl text-foreground">
                  Join the waitlist to get early access
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Both fields are optional. Your diagrams are saved either way.
                </p>
                <div className="mt-5 space-y-3">
                  <div>
                    <label className="text-sm font-medium text-foreground">Name</label>
                    <input
                      type="text"
                      value={modalName}
                      onChange={(e) => setModalName(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Email</label>
                    <input
                      type="email"
                      value={modalEmail}
                      onChange={(e) => setModalEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-accent"
                    />
                  </div>
                </div>
                {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setModalOpen(false)}
                    className="flex-1 rounded-full border border-border py-3 text-sm hover:border-accent"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submit}
                    disabled={submitting}
                    className="flex-1 rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                  >
                    {submitting ? "Saving…" : "Submit"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
