import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { VennDiagram } from "@/components/VennDiagram";

export const Route = createFileRoute("/diagram")({
  head: () => ({
    meta: [
      { title: "Your Diagram, The Harmony of Relationships" },
      {
        name: "description",
        content:
          "An interactive Venn diagram for mapping how you distribute yourself across the relationships in your life.",
      },
      { property: "og:title", content: "Your Diagram, The Harmony of Relationships" },
      {
        property: "og:description",
        content: "Map how you distribute yourself across your relationships.",
      },
    ],
  }),
  component: DiagramPage,
});

function DiagramPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-12 md:py-16">
        <p className="text-xs uppercase tracking-[0.18em] text-accent">Your diagram</p>
        <h1 className="mt-2 font-serif text-4xl md:text-5xl text-foreground">
          Where does your time and energy actually go?
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground leading-relaxed">
          Add a circle for each significant relationship or domain in your life. Two things
          matter here: <strong>how big</strong> a circle is (the time and energy it takes)
          and <strong>how much it overlaps</strong>, with you, and with the other circles.
          You can be present in every relationship without any of them touching each other.
          Drag and resize until the picture matches your life today, then switch to{" "}
          <em>Ideal</em> and shape the one you would want.
        </p>
        <div className="mt-10">
          <VennDiagram />
        </div>
      </main>
    </div>
  );
}