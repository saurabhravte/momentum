"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/* Each step gets its own bright accent (the --pop-* tokens from globals.css).
   Primary stays black/white; the pop colours are small interactive flourishes. */
const STEPS = [
  {
    id: "connect",
    title: "Connect Gmail & Calendar",
    body: "One consent screen. We pull recent mail and events in the background.",
    pop: "pop-cyan",
  },
  {
    id: "ask",
    title: "Ask in plain language",
    body: "Type what you want done. Momentum plans the work across your inbox and calendar.",
    pop: "pop-amber",
  },
  {
    id: "approve",
    title: "Review, then approve",
    body: "Every send or change waits in a review queue. Nothing fires without your nod.",
    pop: "accent",
  },
] as const;

/* A faithful, self-contained mock of the product dashboard so the marketing box
   never depends on a missing screenshot file. Drop a real PNG into
   /public/how/<id>.png and swap this for <Image/> if you'd rather use a capture. */
function DashboardPreview({ stepId, pop }: { stepId: string; pop: string }) {
  const rows =
    stepId === "connect"
      ? ["Gmail connected", "Calendar connected", "Slack — connect", "GitHub — connect"]
      : stepId === "ask"
        ? ["Reschedule my 3pm and tell Raj", "Summarise the launch thread", "Draft reply to Priya"]
        : ["Send reply to Priya", "Move standup to 11:00", "Create task: ship v1.1"];
  return (
    <div className="flex h-full w-full gap-3 bg-bg p-3" style={{ ["--pop" as string]: `var(--${pop})` }}>
      {/* mini sidebar */}
      <div className="hidden w-24 shrink-0 flex-col gap-1.5 sm:flex">
        {["Overview", "Inbox", "Calendar", "Tasks", "Review"].map((l, i) => (
          <div
            key={l}
            className="rounded-md px-2 py-1 text-[10px] font-medium"
            style={
              i === 0
                ? { background: "rgb(var(--pop) / 0.16)", color: "rgb(var(--pop))" }
                : { color: "rgb(var(--muted))" }
            }
          >
            {l}
          </div>
        ))}
      </div>
      {/* main panel */}
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="h-2.5 w-24 rounded-full bg-surface-2" />
          <span
            className="rounded-full px-2 py-0.5 text-[9px] font-semibold"
            style={{ background: "rgb(var(--pop) / 0.16)", color: "rgb(var(--pop))" }}
          >
            live
          </span>
        </div>
        {rows.map((r, i) => (
          <div
            key={i}
            className="flex items-center gap-2 rounded-lg border border-line bg-surface px-2.5 py-2"
            style={{ borderLeft: "3px solid rgb(var(--pop))" }}
          >
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: "rgb(var(--pop))" }} />
            <span className="truncate text-[10px] text-ink">{r}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HowItWorks() {
  const [active, setActive] = useState<string>(STEPS[0].id);
  const current = STEPS.find((s) => s.id === active)!;

  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-24">
      <h2 className="text-center font-display text-3xl font-bold sm:text-4xl">How Momentum works</h2>
      <p className="mx-auto mt-3 max-w-xl text-center text-muted">
        Three steps from a noisy inbox to work that runs itself.
      </p>

      <div className="mt-12 grid items-center gap-10 lg:grid-cols-2">
        <ul className="space-y-2">
          {STEPS.map((s) => {
            const on = s.id === active;
            return (
              <li key={s.id}>
                <button
                  onClick={() => setActive(s.id)}
                  style={{
                    ["--pop" as string]: `var(--${s.pop})`,
                    borderLeftColor: on ? "rgb(var(--pop))" : "rgb(var(--pop) / 0.35)",
                  }}
                  className={`w-full rounded-2xl border border-l-4 p-5 text-left transition-colors ${
                    on ? "bg-surface-2" : "bg-surface hover:bg-surface-2"
                  }`}
                >
                  <h3 className="font-semibold" style={{ color: on ? "rgb(var(--pop))" : undefined }}>
                    {s.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted">{s.body}</p>
                  {on && (
                    <motion.div
                      layoutId="how-underline"
                      className="mt-3 h-0.5 w-16 rounded"
                      style={{ background: "rgb(var(--pop))" }}
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        {/* Apple-style browser frame with a live mock of the dashboard */}
        <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-soft-lg">
          <div className="flex items-center gap-1.5 border-b border-line px-4 py-3">
            <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
            <span className="h-3 w-3 rounded-full bg-[#28c840]" />
            <span className="ml-3 truncate text-xs text-faint">momentum/dashboard/{current.id}</span>
          </div>
          <div className="relative aspect-[16/10]">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="absolute inset-0"
              >
                <DashboardPreview stepId={current.id} pop={current.pop} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
