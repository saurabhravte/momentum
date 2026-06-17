"use client";

import { useEffect, useRef, useState } from "react";
import type { CommandResponse, SearchHit } from "@momentum/shared";
import { api } from "@/lib/api";
import { ApprovalCard } from "@/components/ApprovalCard";
import { timeAgo } from "@/lib/format";

type Mode = "act" | "search";

/**
 * One box, two superpowers:
 *  - Act: natural language → agent proposes actions you approve ("reschedule my 3pm and tell Raj")
 *  - Search: pgvector local search (sub-second) or Gmail advanced search
 *
 * Non-dev unlock: a blank command box is intimidating — most people don't
 * know what to type. So when the box is empty we show ONE-TAP example chips.
 * Clicking a chip fills + runs it, so the very first interaction succeeds.
 */

/* The example prompts double as a live demo. Keep them short, concrete and
   in plain language — these are the first words a new user reads. */
const SUGGESTIONS: Record<Mode, string[]> = {
  act: [
    "Summarise my morning",
    "Reschedule my 3pm and tell Raj on Slack",
    "Draft a reply to the latest invoice email",
    "What needs a reply today?",
  ],
  search: [
    "that invoice from last month",
    "the launch review thread",
    "files Priya sent me",
  ],
};

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mode, setMode] = useState<Mode>("act");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<CommandResponse | null>(null);
  const [hits, setHits] = useState<SearchHit[] | null>(null);
  const [tookMs, setTookMs] = useState<number | null>(null);
  const [engine, setEngine] = useState<"local" | "gmail">("local");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setText("");
      setResult(null);
      setHits(null);
      setTookMs(null);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  /* accepts an optional override so a chip can run instantly without
     waiting on the async setText. */
  async function run(override?: string) {
    const q = (override ?? text).trim();
    if (!q || busy) return;
    if (override) setText(override);
    setBusy(true);
    setResult(null);
    setHits(null);
    try {
      if (mode === "act") {
        setResult(await api.command(q));
      } else {
        const r = await api.search({ mode: engine, q });
        setHits(r.hits ?? []);
        setTookMs(r.tookMs ?? null);
      }
    } catch (e) {
      setResult({ reply: e instanceof Error ? e.message : "Something went wrong", proposals: [] });
    } finally {
      setBusy(false);
    }
  }

  const showSuggestions = !busy && !result && !hits && text.trim() === "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-ink-950/70 p-6 pt-[12vh] backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="card w-full max-w-2xl overflow-hidden animate-rise" onClick={(e) => e.stopPropagation()}>
        {/* mode tabs */}
        <div className="flex items-center gap-1 border-b border-ink-800 px-3 pt-3">
          {(
            [
              ["act", "⚡ Act", "Natural-language actions across all four tools"],
              ["search", "🔍 Search", "Semantic local search or Gmail advanced"],
            ] as const
          ).map(([m, label, title]) => (
            <button
              key={m}
              title={title}
              onClick={() => {
                setMode(m);
                setResult(null);
                setHits(null);
              }}
              className={`rounded-t-xl px-4 py-2 text-sm font-medium ${
                mode === m ? "bg-ink-800 text-accent" : "text-ink-400 hover:text-ink-200"
              }`}
            >
              {label}
            </button>
          ))}
          {mode === "search" && (
            <div className="ml-auto flex gap-1 pb-1.5">
              {(["local", "gmail"] as const).map((e) => (
                <button
                  key={e}
                  onClick={() => setEngine(e)}
                  className={`chip ${engine === e ? "bg-accent/15 text-accent" : "bg-ink-800 text-ink-400"}`}
                >
                  {e === "local" ? "⚡ local <1s" : "gmail advanced"}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 px-4 py-3">
          <span className="text-accent">{busy ? <span className="animate-pulse-soft">◉</span> : "◎"}</span>
          <input
            ref={inputRef}
            className="flex-1 bg-transparent text-[15px] text-ink-100 placeholder:text-ink-400 focus:outline-none"
            placeholder={
              mode === "act"
                ? "Tell Momentum what to do — e.g. reschedule my 3pm and tell Raj…"
                : engine === "local"
                  ? "Search anything — that invoice thing from last month…"
                  : "from:acme has:attachment after:2026/01/01…"
            }
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && run()}
          />
          <span className="kbd">↵</span>
        </div>

        {/* ---- one-tap example chips (the non-dev unlock) ---- */}
        {showSuggestions && (
          <div className="border-t border-ink-800 px-4 py-3">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-ink-400">
              {mode === "act" ? "Try one of these" : "Search ideas"}
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS[mode].map((s) => (
                <button
                  key={s}
                  onClick={() => run(s)}
                  className="chip border border-ink-800 bg-ink-850 text-ink-200 transition-colors hover:border-accent/50 hover:text-accent"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {(result || hits) && (
          <div className="max-h-[50vh] overflow-y-auto border-t border-ink-800 p-4">
            {result && (
              <>
                <p className="whitespace-pre-wrap text-sm text-ink-200">{result.reply}</p>
                {result.proposals.length > 0 && (
                  <div className="mt-3 space-y-3">
                    {result.proposals.map((p) => (
                      <ApprovalCard key={p.id} action={p} />
                    ))}
                  </div>
                )}
              </>
            )}
            {hits && (
              <>
                {tookMs != null && (
                  <p className="mb-2 font-mono text-[11px] text-fyi">
                    ⚡ {tookMs}ms · pgvector over Corsair&apos;s local cache
                  </p>
                )}
                {hits.length === 0 && <p className="text-sm text-ink-400">No results.</p>}
                <ul className="space-y-1">
                  {hits.map((h) => (
                    <li key={h.id} className="rounded-xl px-3 py-2 hover:bg-ink-850">
                      <div className="flex items-center justify-between gap-3">
                        <span className="truncate text-sm text-ink-100">
                          {h.kind === "event" ? "▦ " : "✉ "}
                          {h.title}
                        </span>
                        <span className="shrink-0 font-mono text-[11px] text-ink-400">{timeAgo(h.occurredAt)}</span>
                      </div>
                      <p className="truncate text-xs text-ink-400">{h.snippet}</p>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-ink-800 px-4 py-2 text-[11px] text-ink-400">
          <span>
            {mode === "act"
              ? "Nothing runs until you approve — Momentum proposes, you decide."
              : "Search never leaves your data unscoped."}
          </span>
          <span>
            <span className="kbd">esc</span> close
          </span>
        </div>
      </div>
    </div>
  );
}
