"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";

const STEPS = [
  {
    id: "connect",
    title: "Connect Gmail & Calendar",
    body: "One consent screen. We pull recent mail and events in the background.",
    img: "/how/connect.png",
  },
  {
    id: "ask",
    title: "Ask in plain language",
    body: "Type what you want done. Momentum plans the work across your inbox and calendar.",
    img: "/how/ask.png",
  },
  {
    id: "approve",
    title: "Review, then approve",
    body: "Every send or change waits in a review queue. Nothing fires without your nod.",
    img: "/how/approve.png",
  },
];

export function HowItWorks() {
  const [active, setActive] = useState(STEPS[0].id);
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
                  className={`w-full rounded-2xl border p-5 text-left transition-colors ${
                    on ? "border-accent/50 bg-accent-soft" : "border-line bg-surface hover:bg-surface-2"
                  }`}
                >
                  <h3 className="font-semibold">{s.title}</h3>
                  <p className="mt-1 text-sm text-muted">{s.body}</p>
                  {on && <motion.div layoutId="how-underline" className="mt-3 h-0.5 w-16 rounded bg-accent" />}
                </button>
              </li>
            );
          })}
        </ul>

        {/* Apple-style browser image box */}
        <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-soft-lg">
          <div className="flex items-center gap-1.5 border-b border-line px-4 py-3">
            <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
            <span className="h-3 w-3 rounded-full bg-[#28c840]" />
            <span className="ml-3 truncate text-xs text-faint">mailyflow.in/dashboard/{current.id}</span>
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
                <Image src={current.img} alt={current.title} fill className="object-cover" />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
