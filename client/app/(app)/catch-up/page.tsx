"use client";

import { useState } from "react";
import Link from "next/link";
import type { CatchUpItem } from "@momentum/shared";
import { api } from "@/lib/api";
import { useAsync } from "@/lib/hooks";
import { useToast } from "@/components/Toast";
import { UrgencyDot } from "@/components/UrgencyDot";
import { useFocusMode } from "@/lib/store";
import { timeAgo } from "@/lib/format";
import { Segmented } from "@/components/ui/segmented";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const WINDOWS = [
  { label: "3 hours", hours: 3 },
  { label: "Today", hours: 12 },
  { label: "24 hours", hours: 24 },
  { label: "The weekend", hours: 72 },
];

const KIND_ICON: Record<CatchUpItem["kind"], string> = {
  email: "✉",
  slack: "💬",
  github_pr: "⎇",
  github_issue: "◉",
  calendar: "▦",
};

const KIND_COLOR: Record<CatchUpItem["kind"], string> = {
  email: "var(--pop-amber)",
  slack: "var(--pop-pink)",
  github_pr: "var(--hover)",
  github_issue: "var(--pop-blue)",
  calendar: "var(--accent)",
};

const KIND_LABEL: Record<CatchUpItem["kind"], string> = {
  email: "Email",
  slack: "Slack",
  github_pr: "Pull requests",
  github_issue: "Issues",
  calendar: "Calendar",
};

export default function CatchUpPage() {
  const [hours, setHours] = useState(12);

  const [view, setView] = useState<"summary" | "all">("summary");
  const focus = useFocusMode();
  const { data, loading, reload } = useAsync(() => api.catchUp(hours), [hours]);
  const toast = useToast();
  const [draft, setDraft] = useState<{ item: CatchUpItem; text: string } | null>(null);

  const items = (data?.items ?? []).filter((i) => !focus || i.urgency >= 70);

  async function quickAction(item: CatchUpItem, action: string) {
    try {
      if (action === "snooze" && item.ref.emailId) {
        const until = new Date(Date.now() + 3 * 3600_000).toISOString();
        await api.snooze({ emailId: item.ref.emailId, until });
        toast("Snoozed for 3 hours — it'll resurface", "success");
        reload();
      } else if (action === "task") {
        await api.createTask({ title: item.title });
        toast("Added to your task board", "success");
      } else if (action === "reply" && item.ref.threadId) {
        const { draft: text } = await api.draftReply({ threadId: item.ref.threadId });
        setDraft({ item, text });
      } else if (action === "open" && item.ref.url) {
        window.open(item.ref.url, "_blank");
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : "Action failed", "error");
    }
  }

  async function sendDraft() {
    if (!draft?.item.ref.threadId) return;
    try {
      const to = draft.item.ref.from ? [draft.item.ref.from] : [];
      const { jobId, undoUntil } = await api.send({
        to,
        subject: `Re: ${draft.item.title}`,
        body: draft.text,
        threadId: draft.item.ref.threadId,
      });
      const secs = Math.max(1, Math.round((new Date(undoUntil).getTime() - Date.now()) / 1000));
      toast(
        `Sending in ${secs}s…`,
        "info",
        { label: "Undo", onClick: () => api.undoSend(jobId).then(() => toast("Send cancelled", "success")) },
        secs * 1000,
      );
      setDraft(null);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Send failed", "error");
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <header className="text-center">
        <h1 className="font-display text-3xl font-bold">☀ Catch Me Up</h1>
        <p className="mt-2 text-sm text-ink-400">I was offline for…</p>
        <div className="mt-3 flex justify-center gap-2">
          {WINDOWS.map((w) => (
            <button
              key={w.hours}
              onClick={() => setHours(w.hours)}
              className={`chip ${hours === w.hours ? "bg-accent/15 text-accent" : "bg-ink-800 text-ink-300 hover:text-ink-100"}`}
            >
              {w.label}
            </button>
          ))}
        </div>
      </header>

      <div className="mt-4 flex justify-center">
        <Segmented
          value={view}
          onChange={setView}
          options={[
            { value: "summary", label: "Summary" },
            { value: "all", label: `All items (${items.length})` },
          ]}
        />
      </div>

      {loading ? (
        <p className="mt-10 text-center text-sm text-ink-400 animate-pulse-soft">scanning your workspace…</p>
      ) : (
        <>
          <div className="card mt-6 border-accent/30 p-5 text-center">
            <p className="font-display text-lg">{data?.headline}</p>
            <div className="mt-3 flex justify-center gap-6 font-mono text-[11px] text-ink-400">
              <span>✉ {data?.stats.emails} emails</span>
              <span>💬 {data?.stats.slackThreads} threads</span>
              <span>⎇ {data?.stats.prs} PRs</span>
              <span>▦ {data?.stats.meetingsToday} meetings today</span>
            </div>
          </div>

          {view === "all" &&
            (items.length === 0 ? (
              <p className="mt-8 py-10 text-center text-sm text-muted">
                Nothing needs you from this window.{" "}
                <Link href="/dashboard" className="text-accent hover:underline">
                  Back to the dashboard →
                </Link>
              </p>
            ) : (
              <div className="mt-5 space-y-6">
                {(Object.keys(KIND_LABEL) as CatchUpItem["kind"][]).map((kind) => {
                  const group = items.filter((i) => i.kind === kind);
                  if (group.length === 0) return null;
                  const color = KIND_COLOR[kind];
                  return (
                    <section key={kind}>
                      <div className="mb-2 flex items-center gap-2">
                        <span
                          className="grid h-6 w-6 place-items-center rounded-md text-sm"
                          style={{ background: `rgb(${color} / 0.16)`, color: `rgb(${color})` }}
                        >
                          {KIND_ICON[kind]}
                        </span>
                        <h3 className="text-sm font-semibold">{KIND_LABEL[kind]}</h3>
                        <span className="text-xs text-faint">{group.length}</span>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {group.map((i) => (
                          <div
                            key={i.id}
                            className="card-pop animate-rise border-l-4 p-4"
                            style={{ borderLeftColor: `rgb(${color})`, ["--pop" as string]: color }}
                          >
                            <div className="flex items-baseline justify-between gap-3">
                              <div className="flex min-w-0 items-center gap-2">
                                <UrgencyDot urgency={i.urgency} />
                                <p className="truncate text-sm font-medium text-ink">{i.title}</p>
                              </div>
                              <span className="shrink-0 font-mono text-[11px] text-faint">{timeAgo(i.occurredAt)}</span>
                            </div>
                            <p className="mt-1 line-clamp-3 text-sm text-muted">{i.summary}</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {i.actions.map((a) => (
                                <button
                                  key={a}
                                  onClick={() => quickAction(i, a)}
                                  style={{ ["--pop" as string]: color }}
                                  className="rounded-lg border border-line px-2.5 py-1 text-xs text-ink transition-colors hover:border-[rgb(var(--pop)/0.6)] hover:text-[rgb(var(--pop))]"
                                >
                                  {a === "reply"
                                    ? "↩ draft reply"
                                    : a === "snooze"
                                      ? "◷ snooze 3h"
                                      : a === "task"
                                        ? "✓ to task"
                                        : a === "approve_draft"
                                          ? "✓ approve"
                                          : "↗ open"}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            ))}
        </>
      )}

      {/* Draft reply modal — draft-first, you approve the send */}
      <Dialog open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>AI draft — re: {draft?.item.title}</DialogTitle>
          </DialogHeader>

          <textarea
            className="input h-44 resize-none font-body"
            value={draft?.text ?? ""}
            onChange={(e) => draft && setDraft({ ...draft, text: e.target.value })}
          />

          <DialogFooter className="items-center justify-between sm:justify-between">
            <span className="text-[11px] text-faint">30s undo window after send</span>
            <div className="flex gap-2">
              <button className="btn-ghost" onClick={() => setDraft(null)}>
                Discard
              </button>
              <button className="btn-primary" onClick={sendDraft}>
                Send with undo
              </button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
