"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Search, Mail, Calendar, FileText, Send, Inbox, Check, CornerUpLeft } from "lucide-react";

/**
 * Landing hero. Centered headline + a browser-framed product preview of the
 * Momentum workspace, with floating status chips. Inspiration taken from
 * email-first clients, rendered entirely in Momentum's own token system:
 * the lime --accent stays primary; bright --pop-* colors are used only for
 * small interactive flourishes (chips, dots).
 */
export function Hero() {
  return (
    <section id="how" className="relative overflow-hidden px-4 pt-36 pb-20 sm:pt-44">
      {/* ambient backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-grid opacity-60" />
      <div
        aria-hidden
        className="animate-glow pointer-events-none absolute -top-24 left-1/2 -z-10 h-[460px] w-[860px] -translate-x-1/2 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(45% 45% at 50% 50%, rgb(var(--accent) / 0.20), transparent 70%), radial-gradient(35% 35% at 72% 30%, rgb(var(--pop-cyan) / 0.16), transparent 70%), radial-gradient(35% 35% at 28% 60%, rgb(var(--pop-violet) / 0.14), transparent 70%)",
        }}
      />

      <div className="mx-auto flex max-w-5xl flex-col items-center gap-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex max-w-3xl flex-col items-center gap-6"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-muted">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            Your AI command center for email &amp; calendar
          </span>

          <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-[64px]">
            Work, finally in{" "}
            <span className="relative whitespace-nowrap text-gradient">
              one happy place
              <svg
                className="absolute -bottom-1 left-0 w-full"
                height="10"
                viewBox="0 0 200 10"
                fill="none"
                preserveAspectRatio="none"
                aria-hidden
              >
                <path d="M2 7C50 2 150 2 198 7" stroke="rgb(var(--accent))" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </span>
            .
          </h1>

          <p className="max-w-xl text-pretty text-base leading-relaxed text-muted sm:text-lg">
            Gmail, Calendar, Slack and GitHub scatter your day across four tabs. Momentum pulls them into one stream,
            drafts the busywork, and waits for your nod before anything goes out.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/login"
              className="group inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-bg shadow-soft transition-transform hover:scale-[1.03]"
            >
              Start free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="#how-it-works"
              className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-surface-2"
            >
              See how it works
            </Link>
          </div>
        </motion.div>

        {/* Browser-framed product preview */}
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full"
        >
          <div className="relative mx-auto w-full max-w-[1020px]">
            <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-soft-lg">
              {/* browser bar */}
              <div className="flex items-center gap-2 border-b border-line bg-surface-2/60 px-4 py-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                <span className="mx-auto flex items-center gap-1.5 rounded-md border border-line bg-surface px-4 py-1 text-[11px] text-muted">
                  <span className="font-semibold text-accent">https://</span>
                  momentum.app/dashboard
                </span>
                <span className="w-10" />
              </div>
              <ProductPreview />
            </div>

            {/* floating chips */}
            <FloatChip
              className="animate-float -left-6 top-16 hidden md:flex"
              icon={<CornerUpLeft className="h-3.5 w-3.5" />}
              title="Smart reply drafted"
              sub="Re: Q3 investor update"
              pop="pop-violet"
            />
            <FloatChip
              className="animate-float-lg -right-6 top-40 hidden md:flex"
              icon={<Calendar className="h-3.5 w-3.5" />}
              title="Meeting scheduled"
              sub="Tue 3:00 PM · 5 invitees"
              pop="pop-blue"
            />
            <FloatChip
              className="animate-float -bottom-6 left-24 hidden md:flex"
              icon={<Check className="h-3.5 w-3.5" />}
              title="Inbox triaged"
              sub="12 emails sorted"
              pop="pop-cyan"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

const PREVIEW_EMAILS = [
  {
    sender: "Stripe",
    subject: "Your payout is on the way",
    snippet: "₹84,200 will arrive in 1–2 days…",
    tag: "FYI",
    unread: false,
    color: "var(--fyi)",
  },
  {
    sender: "Priya (Acme)",
    subject: "Can we move our sync to Thursday?",
    snippet: "Something came up Wednesday…",
    tag: "Reply",
    unread: true,
    color: "var(--reply)",
  },
  {
    sender: "GitHub",
    subject: "PR #214 needs your review",
    snippet: "feat: streaming search results…",
    tag: "Waiting",
    unread: true,
    color: "var(--waiting)",
  },
  {
    sender: "Raj Mehta",
    subject: "Contract — signature needed today",
    snippet: "Flagging this as time-sensitive…",
    tag: "Urgent",
    unread: true,
    color: "var(--urgent)",
  },
  {
    sender: "Figma",
    subject: "3 comments on Momentum v2",
    snippet: "Nibedita mentioned you…",
    tag: "FYI",
    unread: false,
    color: "var(--news)",
  },
];

function ProductPreview() {
  return (
    <div className="grid h-[440px] grid-cols-1 bg-surface text-left text-ink md:grid-cols-[150px_1fr] lg:grid-cols-[150px_1fr_220px]">
      {/* sidebar */}
      <aside className="hidden flex-col gap-5 border-r border-line bg-surface-2/50 p-4 md:flex">
        <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-faint">Mail</p>
        <nav className="-mt-3 flex flex-col gap-1">
          <NavRow icon={<Inbox className="h-3.5 w-3.5" />} label="Inbox" active count={15} />
          <NavRow icon={<FileText className="h-3.5 w-3.5" />} label="Drafts" />
          <NavRow icon={<Send className="h-3.5 w-3.5" />} label="Sent" />
        </nav>
        <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-faint">Calendar</p>
        <nav className="-mt-3 flex flex-col gap-1">
          <NavRow icon={<Calendar className="h-3.5 w-3.5" />} label="Today" />
        </nav>
      </aside>

      {/* list */}
      <div className="flex min-w-0 flex-col">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <div className="flex items-center gap-2 rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-[11px] text-muted">
            <Search className="h-3 w-3" /> Search mail, events, people…
            <span className="kbd ml-2">⌘K</span>
          </div>
        </div>
        <div className="flex-1 divide-y divide-line overflow-hidden">
          {PREVIEW_EMAILS.map((e, i) => (
            <div key={i} className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-surface-2/40">
              <span
                className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: e.unread ? "rgb(var(--accent))" : "transparent" }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className={`truncate text-[12px] ${e.unread ? "font-semibold text-ink" : "text-muted"}`}>
                    {e.sender}
                  </span>
                  <span
                    className="shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold"
                    style={{ background: `rgb(${e.color} / 0.14)`, color: `rgb(${e.color})` }}
                  >
                    {e.tag}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-[11px] text-muted">
                  <span className={e.unread ? "text-ink" : ""}>{e.subject}</span> — {e.snippet}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI panel */}
      <aside className="hidden flex-col border-l border-line bg-surface-2/50 p-4 lg:flex">
        <div className="mb-3 flex items-center gap-2 border-b border-line pb-2.5 text-[12px] font-semibold text-accent">
          <Sparkles className="h-3.5 w-3.5" /> AI Assistant
        </div>
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <span className="relative mb-3 grid h-11 w-11 place-items-center rounded-full bg-accent-soft text-accent">
            <Sparkles className="h-5 w-5" />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 animate-pulse rounded-full bg-accent" />
          </span>
          <p className="text-[11px] leading-relaxed text-muted">
            Ask me to triage your inbox, draft a reply, or schedule a meeting.
          </p>
        </div>
        <div className="mt-auto flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2">
          <span className="flex-1 text-[11px] text-muted">Ask anything…</span>
          <span className="grid h-6 w-6 place-items-center rounded-full bg-accent text-bg">
            <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </aside>
    </div>
  );
}

function NavRow({
  icon,
  label,
  active,
  count,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  count?: number;
}) {
  return (
    <span
      className={`flex items-center justify-between rounded-lg px-3 py-2 text-[12px] ${
        active ? "bg-accent/12 font-semibold text-accent" : "text-muted"
      }`}
    >
      <span className="flex items-center gap-2.5">
        {icon}
        {label}
      </span>
      {count != null && (
        <span className="rounded-full bg-accent/20 px-1.5 text-[9px] font-bold text-accent">{count}</span>
      )}
    </span>
  );
}

function FloatChip({
  className,
  icon,
  title,
  sub,
  pop,
}: {
  className: string;
  icon: React.ReactNode;
  title: string;
  sub: string;
  pop: string;
}) {
  return (
    <div
      className={`absolute z-10 flex items-center gap-2.5 rounded-xl border border-line bg-surface px-3 py-2 shadow-float ${className}`}
    >
      <span
        className="grid h-7 w-7 place-items-center rounded-lg text-white"
        style={{ background: `rgb(var(--${pop}))` }}
      >
        {icon}
      </span>
      <div className="text-left">
        <p className="text-[11px] font-semibold leading-tight text-ink">{title}</p>
        <p className="text-[10px] leading-tight text-muted">{sub}</p>
      </div>
    </div>
  );
}
