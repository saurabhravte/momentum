"use client";

import { motion } from "framer-motion";
import { Inbox, Sparkles, ShieldCheck, ArrowRight } from "lucide-react";

/**
 * "How the workflow runs" — three columns mapping a before → during → after
 * flow. Each stage now carries its own bright --pop-* colour so the section
 * reads as lively and interactive while the lime --accent stays the brand.
 */
const STAGES = [
  {
    icon: Inbox,
    pop: "pop-blue",
    tag: "Everything lands here",
    title: "One stream, not four tabs",
    body: "Gmail, Calendar, Slack and GitHub flow into a single prioritised feed. No more tab-switching tax across the day.",
    points: ["Auto-triaged by urgency", "Smart labels: client, invoice, interview", "Read once, act once"],
  },
  {
    icon: Sparkles,
    pop: "pop-violet",
    tag: "Momentum does the legwork",
    title: "Drafts, briefs & catch-ups",
    body: "Pre-meeting briefs, reply drafts, and a one-tap daily catch-up are prepared for you — so you start from 80%, not zero.",
    points: ["Catch Me Up digest", "AI reply drafts in your voice", "Meeting detected → create event"],
  },
  {
    icon: ShieldCheck,
    pop: "pop-cyan",
    tag: "You stay in control",
    title: "Reads everything, sends nothing alone",
    body: "Every outbound action waits in a review queue. Approve, edit, or undo — nothing leaves without your explicit nod.",
    points: ["Approval gate on every send", "Undo window on outbound mail", "Disconnect wipes all cached data"],
  },
];

export function Workflow() {
  return (
    <section id="workflow" className="mx-auto max-w-6xl px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-medium text-accent">The workflow</p>
        <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          From scattered inbox to a workday that runs itself
        </h2>
        <p className="mt-3 text-muted">
          Built for people who live in their inbox all day. Here is what actually happens once Momentum is connected.
        </p>
      </div>

      <div className="mt-14 grid gap-5 md:grid-cols-3">
        {STAGES.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.35, delay: i * 0.08 }}
            className="card-pop group relative flex flex-col p-6"
            style={{ ["--pop" as string]: `var(--${s.pop})` }}
          >
            <div className="flex items-center gap-3">
              <span
                className="grid h-10 w-10 place-items-center rounded-xl transition-transform duration-200 group-hover:scale-110"
                style={{ background: "rgb(var(--pop) / 0.14)", color: "rgb(var(--pop))" }}
              >
                <s.icon className="h-5 w-5" />
              </span>
              <span className="text-xs font-medium uppercase tracking-wide text-faint">Step {i + 1}</span>
            </div>

            <p className="mt-4 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "rgb(var(--pop))" }}>
              {s.tag}
            </p>
            <h3 className="mt-1 font-display text-lg font-semibold">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>

            <ul className="mt-4 space-y-2 border-t border-line pt-4">
              {s.points.map((p) => (
                <li key={p} className="flex items-center gap-2 text-sm text-ink">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "rgb(var(--pop))" }} />
                  {p}
                </li>
              ))}
            </ul>

            {i < STAGES.length - 1 && (
              <ArrowRight className="absolute -right-3 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-faint md:block" />
            )}
          </motion.div>
        ))}
      </div>

      <div className="mt-10 flex flex-col items-center gap-3 rounded-3xl border border-line bg-surface px-6 py-8 text-center sm:flex-row sm:justify-between sm:text-left">
        <div>
          <p className="font-display text-lg font-semibold">The Cost-of-Context, recovered</p>
          <p className="mt-1 text-sm text-muted">
            Teams switch tools 1,200+ times a day. Momentum bundles the noise so your focus compounds.
          </p>
        </div>
        <a
          href="/login"
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-bg transition-transform hover:scale-[1.02]"
        >
          Start free <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </section>
  );
}
