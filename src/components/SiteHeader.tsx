import { Link, useRouter } from "@tanstack/react-router";
import { useLocalStorage } from "@/lib/storage";

export function SiteHeader() {
  const router = useRouter();
  const path = router.state.location.pathname;
  const isFacilitator = path.startsWith("/facilitator");
  const [, setMode] = useLocalStorage<"self" | "facilitator">("hor.mode", "self");

  return (
    <header className="border-b border-border/60 bg-background/80 backdrop-blur sticky top-0 z-30">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link
          to="/"
          className="flex items-center gap-2.5 group"
          onClick={() => setMode("self")}
        >
          <VennMark />
          <span className="font-serif text-lg tracking-tight text-foreground">
            The Harmony of Relationships
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
          <Link to="/framework" activeProps={{ className: "text-foreground" }} className="hover:text-foreground transition-colors">
            Framework
          </Link>
          <Link to="/sessions" activeProps={{ className: "text-foreground" }} className="hover:text-foreground transition-colors">
            Sessions
          </Link>
          <Link to="/diagram" activeProps={{ className: "text-foreground" }} className="hover:text-foreground transition-colors">
            Diagram
          </Link>
          <Link
            to={isFacilitator ? "/" : "/facilitator"}
            className="rounded-full border border-border px-3.5 py-1.5 text-foreground/80 hover:border-accent hover:text-foreground transition-colors"
            onClick={() => setMode(isFacilitator ? "self" : "facilitator")}
          >
            {isFacilitator ? "Self mode" : "Facilitator"}
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function VennMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 24" className={`h-6 w-10 ${className}`} aria-hidden>
      <circle cx="14" cy="12" r="10" fill="none" stroke="var(--circle-self)" strokeWidth="1.5" opacity="0.85" />
      <circle cx="26" cy="12" r="10" fill="none" stroke="var(--accent)" strokeWidth="1.5" opacity="0.85" />
    </svg>
  );
}