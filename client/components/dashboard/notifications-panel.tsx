"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Check, X, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

type Note = {
  id: string;
  title: string;
  body: string;
  time: string;
  unread?: boolean;
  proposalId?: string;
  color?: string;
};

const KIND_LABEL: Record<string, string> = {
  send_email: "Email awaiting approval",
  create_event: "Event awaiting approval",
  update_event: "Event change awaiting approval",
  slack_post: "Slack post awaiting approval",
  github_create_issue: "GitHub issue awaiting approval",
};

const KIND_COLOR: Record<string, string> = {
  send_email: "var(--pop-amber)",
  create_event: "var(--pop-cyan)",
  update_event: "var(--pop-cyan)",
  slack_post: "var(--pop-pink)",
  github_create_issue: "var(--hover)",
};

export function NotificationsPanel() {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [busyId, setBusyId] = useState<string | null>(null);
  const router = useRouter();

  // Pull real notifications: pending approvals + recent activity.
  async function load() {
    try {
      const [proposals, activity] = await Promise.all([
        api.proposals().catch(() => []),
        api.activity().catch(() => []),
      ]);
      const fromProposals: Note[] = proposals
        .filter((p) => p.status === "pending")
        .map((p) => ({
          id: `p:${p.id}`,
          proposalId: p.id,
          title: KIND_LABEL[p.kind] ?? "Action awaiting approval",
          body: p.description,
          time: timeAgo(p.createdAt),
          color: KIND_COLOR[p.kind] ?? "var(--accent)",
          unread: true,
        }));
      const fromActivity: Note[] = activity.map((a) => ({
        id: `a:${a.id}`,
        title: a.action,
        body: a.summary,
        time: timeAgo(a.at),
        color: "var(--accent)",
      }));
      setNotes([...fromProposals, ...fromActivity]);
    } catch {
      /* keep prior state */
    }
  }

  useEffect(() => {
    let alive = true;
    const run = () => {
      if (alive) load();
    };
    run();
    const id = setInterval(run, 60_000); // poll once a minute
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  async function decide(proposalId: string, decision: "approve" | "reject") {
    setBusyId(proposalId);
    try {
      await api.decide(proposalId, decision);
      await load();
    } catch {
      /* ignore */
    } finally {
      setBusyId(null);
    }
  }

  const visible = useMemo(() => notes.map((n) => ({ ...n, unread: n.unread && !readIds.has(n.id) })), [notes, readIds]);
  const unread = visible.filter((n) => n.unread).length;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        aria-expanded={open}
        className="relative grid h-9 w-9 place-items-center rounded-full border border-line bg-surface text-muted transition-colors hover:text-ink"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-semibold text-bg">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm"
              aria-hidden
            />
            <motion.aside
              role="dialog"
              aria-label="Notifications"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 38 }}
              className="fixed right-0 top-0 z-50 flex h-full w-80 max-w-[85vw] flex-col border-l border-line bg-surface shadow-soft-lg"
            >
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <span className="font-display text-sm font-semibold">Notifications</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => load()}
                    aria-label="Refresh notifications"
                    className="grid h-7 w-7 place-items-center rounded-md text-muted transition-colors hover:text-ink"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                  {unread > 0 && (
                    <button
                      type="button"
                      onClick={() => setReadIds(new Set(notes.map((n) => n.id)))}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted transition-colors hover:text-ink"
                    >
                      <Check className="h-3 w-3" /> Mark all read
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Close notifications"
                    className="grid h-7 w-7 place-items-center rounded-md text-muted transition-colors hover:text-ink"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2">
                {visible.length === 0 ? (
                  <p className="px-3 py-10 text-center text-sm text-faint">You&apos;re all caught up.</p>
                ) : (
                  <ul className="space-y-2">
                    {visible.map((n) => (
                      <li
                        key={n.id}
                        style={{ borderLeftColor: `rgb(${n.color})` }}
                        className={cn(
                          "rounded-xl border border-line border-l-4 bg-bg p-3 shadow-soft transition-colors hover:bg-surface-2",
                          n.unread && "ring-1 ring-[rgb(var(--hover)/0.25)]",
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-medium">{n.title}</span>
                          <span className="shrink-0 text-[11px] text-faint">{n.time}</span>
                        </div>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted">{n.body}</p>
                        {n.proposalId && (
                          <div className="mt-2.5 flex items-center gap-2">
                            <button
                              type="button"
                              disabled={busyId === n.proposalId}
                              onClick={() => decide(n.proposalId!, "approve")}
                              className="inline-flex items-center gap-1 rounded-md bg-accent px-2.5 py-1 text-xs font-semibold text-bg transition hover:opacity-90 disabled:opacity-50"
                            >
                              <Check className="h-3 w-3" /> Approve
                            </button>
                            <button
                              type="button"
                              disabled={busyId === n.proposalId}
                              onClick={() => decide(n.proposalId!, "reject")}
                              className="inline-flex items-center gap-1 rounded-md border border-line px-2.5 py-1 text-xs font-medium text-muted transition hover:text-ink disabled:opacity-50"
                            >
                              <X className="h-3 w-3" /> Reject
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setOpen(false);
                                router.push("/review");
                              }}
                              className="ml-auto text-xs text-[rgb(var(--hover))] hover:underline"
                            >
                              View
                            </button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
