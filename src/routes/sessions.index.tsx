import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { sessions } from "@/content/workshop";
import { readLocal } from "@/lib/storage";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/sessions/")({
  head: () => ({
    meta: [
      { title: "Sessions, The Harmony of Relationships" },
      {
        name: "description",
        content:
          "The three sessions of The Harmony of Relationships, each with its own core question, narrative, scenario, and reflection.",
      },
      { property: "og:title", content: "Sessions, The Harmony of Relationships" },
      {
        property: "og:description",
        content: "Three sessions to look honestly at how you distribute yourself.",
      },
    ],
  }),
  component: SessionsPage,
});

function SessionsPage() {
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  useEffect(() => {
    setProgress(readLocal<Record<string, boolean>>("hor.progress", {}));
  }, []);

  const isUnlocked = (id: number) => id === 1 || progress[`s${id - 1}`];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-5 py-12 md:py-16">
        <p className="text-xs uppercase tracking-[0.18em] text-accent">The arc</p>
        <h1 className="mt-2 font-serif text-4xl md:text-5xl text-foreground">
          Three sessions
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground leading-relaxed">
          Move through the sessions in order. Each builds on the diagram you draw and the
          questions you sit with along the way.
        </p>

        <div className="mt-10 space-y-4">
          {sessions.map((s) => {
            const unlocked = isUnlocked(s.id);
            const done = progress[`s${s.id}`];
            return (
              <article
                key={s.id}
                className={`rounded-2xl border bg-card p-6 md:p-8 transition-opacity ${
                  unlocked ? "border-border" : "border-border/50 opacity-60"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.15em] text-accent">
                      Session {s.id}
                      {done && <span className="ml-2 text-secondary">· complete</span>}
                    </p>
                    <h2 className="mt-2 font-serif text-2xl md:text-3xl text-foreground">
                      {s.title}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">{s.subtitle}</p>
                    <p className="mt-4 text-foreground/85 italic">"{s.coreQuestion}"</p>
                  </div>
                </div>
                <div className="mt-6">
                  {unlocked ? (
                    <Link
                      to="/sessions/$id"
                      params={{ id: String(s.id) }}
                      className="inline-flex items-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      {done ? "Revisit" : "Begin"}
                    </Link>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Unlocks after Session {s.id - 1}
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
}