import { useLocalStorage } from "@/lib/storage";
import { useState } from "react";

interface Commitment {
  text: string;
  date: string;
}

export function HarmonyCommitment() {
  const [committed, setCommitted] = useLocalStorage<Commitment | null>("hor.commitment", null);
  const [draft, setDraft] = useState("");

  const save = () => {
    if (!draft.trim()) return;
    setCommitted({ text: draft.trim(), date: new Date().toISOString() });
    setDraft("");
  };

  const copy = () => {
    if (!committed) return;
    navigator.clipboard?.writeText(committed.text).catch(() => {});
  };

  const download = () => {
    if (!committed) return;
    const blob = new Blob(
      [`The Harmony of Relationships, Commitment\n${new Date(committed.date).toLocaleString()}\n\n${committed.text}\n`],
      { type: "text/plain" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "harmony-commitment.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (committed) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 md:p-8 venn-bg">
        <p className="text-xs uppercase tracking-[0.18em] text-accent">
          Your commitment · {new Date(committed.date).toLocaleDateString()}
        </p>
        <blockquote className="mt-4 font-serif text-2xl md:text-3xl text-foreground leading-relaxed italic">
          "{committed.text}"
        </blockquote>
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            onClick={copy}
            className="rounded-full border border-border px-4 py-2 text-sm text-foreground/85 hover:border-accent"
          >
            Copy
          </button>
          <button
            onClick={download}
            className="rounded-full border border-border px-4 py-2 text-sm text-foreground/85 hover:border-accent"
          >
            Download
          </button>
          <button
            onClick={() => setCommitted(null)}
            className="rounded-full border border-border px-4 py-2 text-sm text-muted-foreground hover:text-destructive"
          >
            Write a new one
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={5}
        placeholder="One specific, actionable shift you will make…"
        className="w-full rounded-xl border border-border bg-background px-4 py-3 font-serif text-lg text-foreground outline-none focus:border-accent placeholder:text-muted-foreground/70"
      />
      <div className="mt-4 flex justify-end">
        <button
          onClick={save}
          disabled={!draft.trim()}
          className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          Make this my commitment
        </button>
      </div>
    </div>
  );
}