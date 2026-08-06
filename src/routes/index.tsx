import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, VennMark } from "@/components/SiteHeader";
import { intro, sessions } from "@/content/workshop";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Harmony of Relationships, A reflective workshop companion" },
      {
        name: "description",
        content:
          "A 3-session framework for understanding how you distribute yourself across the relationships in your life, and whether it reflects what you actually want.",
      },
      { property: "og:title", content: "The Harmony of Relationships, A reflective workshop companion" },
      {
        property: "og:description",
        content:
          "A 3-session framework for understanding how you distribute yourself across the relationships in your life, and whether it reflects what you actually want.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <section className="venn-bg">
          <div className="mx-auto max-w-4xl px-5 py-20 md:py-28 text-center">
            <div className="mx-auto mb-8 flex justify-center"><VennMark className="h-9 w-16" /></div>
            <h1 className="font-serif text-4xl md:text-6xl leading-[1.05] text-foreground">
              {intro.headline}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
              {intro.subheadline}
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/sessions"
                className="inline-flex items-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Start on your own
              </Link>
              <Link
                to="/framework"
                className="inline-flex items-center rounded-full border border-border bg-background px-6 py-3 text-sm font-medium text-foreground/85 hover:border-accent transition-colors"
              >
                Read the framework
              </Link>
              <Link
                to="/facilitator"
                className="inline-flex items-center rounded-full border border-border bg-background px-6 py-3 text-sm font-medium text-foreground/85 hover:border-accent transition-colors"
              >
                I'm a facilitator
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-5 py-16 md:py-20">
          <div className="space-y-5 text-foreground/85 text-[1.05rem] leading-relaxed">
            {intro.description.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-5 pb-24">
          <p className="mb-8 text-center text-sm uppercase tracking-[0.18em] text-muted-foreground">
            The three sessions
          </p>
          <div className="grid gap-5 md:grid-cols-3">
            {sessions.map((s) => (
              <article
                key={s.id}
                className="rounded-2xl border border-border bg-card p-6"
              >
                <p className="text-xs uppercase tracking-[0.15em] text-accent">
                  Session {s.id}
                </p>
                <h3 className="mt-2 font-serif text-2xl text-foreground">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.subtitle}</p>
                <p className="mt-4 text-sm text-foreground/80 italic leading-relaxed">
                  "{s.coreQuestion}"
                </p>
              </article>
            ))}
          </div>
        </section>

        <footer className="border-t border-border/60">
          <div className="mx-auto max-w-5xl px-5 py-8 text-center text-xs text-muted-foreground">
            Developed by Rafael Posada. Drawing on research by Bronfenbrenner, Deci & Ryan,
            Baumeister & Leary, Neff, Hochschild, Putnam, Csikszentmihalyi, Gottman, Perel,
            Waldinger & Schultz, Holt-Lunstad, the U.S. Surgeon General, and the WHO Commission on Social Connection.
          </div>
        </footer>
      </main>
    </div>
  );
}
