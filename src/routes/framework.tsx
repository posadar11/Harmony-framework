import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { framework } from "@/content/workshop";


export const Route = createFileRoute("/framework")({
  head: () => ({
    meta: [
      { title: "The Conceptual Framework, The Harmony of Relationships" },
      {
        name: "description",
        content:
          "The full conceptual framework: the relational Venn diagram, the research it draws on, and the chapters on work, close relationships, family, friends, and hobbies.",
      },
      { property: "og:title", content: "The Conceptual Framework" },
      {
        property: "og:description",
        content:
          "A framework for relational balance, the Venn diagram, the research, and the chapters on work, close relationships, family, friends, and hobbies.",
      },
    ],
  }),
  component: FrameworkPage,
});

function FrameworkPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-14 md:py-20">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Home
        </Link>
        <p className="mt-6 text-xs uppercase tracking-[0.18em] text-accent">
          {framework.title}
        </p>
        <h1 className="mt-2 font-serif text-4xl md:text-5xl text-foreground leading-tight">
          {framework.subtitle}
        </h1>

        <div className="mt-10 space-y-14">
          {framework.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="font-serif text-2xl md:text-3xl text-foreground">
                {section.heading}
              </h2>
              <div className="mt-5 space-y-5 text-foreground/85 text-[1.05rem] leading-relaxed">
                {section.paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </section>
          ))}




          <div className="flex flex-wrap gap-3 pt-4">
            <Link
              to="/sessions"
              className="inline-flex items-center rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Begin the sessions
            </Link>
            <Link
              to="/diagram"
              className="inline-flex items-center rounded-full border border-border px-5 py-3 text-sm font-medium text-foreground/85 hover:border-accent"
            >
              Open the diagram
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
