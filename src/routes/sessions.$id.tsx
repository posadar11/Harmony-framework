import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { sessions, tracks } from "@/content/workshop";
import { VennDiagram } from "@/components/VennDiagram";
import { HarmonyAudit } from "@/components/HarmonyAudit";
import { HarmonyCommitment } from "@/components/HarmonyCommitment";
import { useLocalStorage } from "@/lib/storage";

export const Route = createFileRoute("/sessions/$id")({
  loader: ({ params }) => {
    const id = Number(params.id);
    const session = sessions.find((s) => s.id === id);
    if (!session) throw notFound();
    return { session };
  },
  head: ({ loaderData }) => {
    const s = loaderData?.session;
    const title = s ? `Session ${s.id}: ${s.title}, The Harmony of Relationships` : "Session";
    const desc = s?.coreQuestion ?? "A session in The Harmony of Relationships.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-5 py-24 text-center">
        <h1 className="font-serif text-3xl text-foreground">Session not found</h1>
        <Link to="/sessions" className="mt-6 inline-block text-accent underline">
          Back to sessions
        </Link>
      </main>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-5 py-24 text-center">
        <h1 className="font-serif text-3xl text-foreground">Something went wrong</h1>
        <p className="mt-3 text-muted-foreground">{error.message}</p>
      </main>
    </div>
  ),
  component: SessionPage,
});

function SessionPage() {
  const { session } = Route.useLoaderData();
  const navigate = useNavigate();
  const [progress, setProgress] = useLocalStorage<Record<string, boolean>>("hor.progress", {});

  const markComplete = () => {
    setProgress({ ...progress, [`s${session.id}`]: true });
    if (session.id < 3) {
      navigate({ to: "/sessions/$id", params: { id: String(session.id + 1) } });
    } else {
      navigate({ to: "/sessions" });
    }
  };

  const isComplete = progress[`s${session.id}`];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-12 md:py-16">
        <Link to="/sessions" className="text-sm text-muted-foreground hover:text-foreground">
          ← All sessions
        </Link>
        <p className="mt-6 text-xs uppercase tracking-[0.18em] text-accent">
          Session {session.id} · {session.subtitle}
        </p>
        <h1 className="mt-2 font-serif text-4xl md:text-5xl text-foreground leading-tight">
          {session.title}
        </h1>

        <div className="mt-8 rounded-2xl border-l-4 border-accent bg-card/70 px-6 py-5">
          <p className="text-xs uppercase tracking-[0.15em] text-accent mb-2">Core question</p>
          <p className="font-serif text-2xl text-foreground italic leading-snug">
            {session.coreQuestion}
          </p>
        </div>

        <section className="mt-10 space-y-5 text-foreground/85 text-[1.05rem] leading-relaxed">
          {session.narrative.map((p: string, i: number) => (
            <p key={i}>{p}</p>
          ))}
        </section>

        <section className="mt-10 rounded-2xl border border-border bg-secondary/15 p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.15em] text-secondary-foreground/70 mb-2">
            Scenario
          </p>
          <p className="text-foreground/90 leading-relaxed italic">{session.scenario}</p>
        </section>

        {session.id === 3 && (
          <section className="mt-10">
            <h2 className="font-serif text-2xl text-foreground">Three tracks</h2>
            <p className="mt-2 text-muted-foreground">
              Pick the one closest to your context, or read all three.
            </p>
            <div className="mt-5 grid gap-3">
              {tracks.map((t) => (
                <details
                  key={t.id}
                  className="rounded-xl border border-border bg-card p-5 group"
                >
                  <summary className="cursor-pointer list-none">
                    <span className="font-serif text-lg text-foreground">{t.title}</span>
                    <p className="mt-1 text-sm italic text-foreground/75">"{t.question}"</p>
                  </summary>
                  <p className="mt-3 text-sm text-foreground/80 leading-relaxed">{t.body}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        <section className="mt-12">
          <p className="text-xs uppercase tracking-[0.18em] text-accent">Reflection</p>
          <h2 className="mt-2 font-serif text-3xl text-foreground">{session.exerciseTitle}</h2>
          <p className="mt-3 text-foreground/80 leading-relaxed">{session.exerciseDescription}</p>

          <div className="mt-8">
            {session.id === 1 && <VennDiagram />}
            {session.id === 2 && <HarmonyAudit />}
            {session.id === 3 && <HarmonyCommitment />}
          </div>
        </section>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-8">
          <p className="text-sm text-muted-foreground">
            {isComplete ? "You've marked this session complete." : "Take your time. Come back to this whenever you need."}
          </p>
          <button
            onClick={markComplete}
            className="rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {session.id < 3 ? "Mark complete & continue" : isComplete ? "Return to sessions" : "Mark complete"}
          </button>
        </div>
      </main>
    </div>
  );
}