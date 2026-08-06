import { useEffect, useState } from "react";
import { TYPE_COLORS } from "@/lib/venn-types";
import type { Circle, VennState } from "@/lib/venn-types";
import { useLocalStorage, readLocal } from "@/lib/storage";

const QUESTIONS = [
  "Is this relationship getting the space it actually needs right now?",
  "Is this overlap a conscious choice, or a default that happened without my awareness?",
  "If I could say one thing to this relationship about what I need, what would it be?",
];

type Answers = Record<string, [string, string, string]>;

export function HarmonyAudit() {
  const [circles, setCircles] = useState<Circle[]>([]);
  const [answers, setAnswers] = useLocalStorage<Answers>("hor.audit", {});

  useEffect(() => {
    const v = readLocal<VennState>("hor.venn", { current: [], ideal: [] });
    setCircles(v.current.length ? v.current : v.ideal);
  }, []);

  if (circles.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
        Add a few circles to your diagram first, then come back to audit each one.
      </div>
    );
  }

  const update = (id: string, idx: 0 | 1 | 2, val: string) => {
    const prev = answers[id] ?? ["", "", ""];
    const next: [string, string, string] = [...prev] as [string, string, string];
    next[idx] = val;
    setAnswers({ ...answers, [id]: next });
  };

  return (
    <div className="space-y-6">
      {circles.map((c) => {
        const a = answers[c.id] ?? ["", "", ""];
        return (
          <article key={c.id} className="rounded-2xl border border-border bg-card p-5 md:p-6">
            <div className="flex items-center gap-3">
              <span
                className="h-3 w-3 rounded-full"
                style={{ background: TYPE_COLORS[c.type] }}
              />
              <h3 className="font-serif text-xl text-foreground">{c.label}</h3>
            </div>
            <div className="mt-4 space-y-4">
              {QUESTIONS.map((q, i) => (
                <div key={i}>
                  <label className="block text-sm text-foreground/85 mb-1.5">{q}</label>
                  <textarea
                    value={a[i as 0 | 1 | 2]}
                    onChange={(e) => update(c.id, i as 0 | 1 | 2, e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
                    placeholder="Write what's true for you…"
                  />
                </div>
              ))}
            </div>
          </article>
        );
      })}
    </div>
  );
}