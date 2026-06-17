"use client";

import { useEffect, useMemo, useState } from "react";
import type { EmailPriority, EmailSummaryDto } from "@momentum/shared";
import { PaperPlaneTilt, MagnifyingGlass, FunnelSimple, X, ArrowLeft } from "@phosphor-icons/react";
import { api } from "@/lib/api";
import { useAsync, useShortcuts, useMe } from "@/lib/hooks";
import { useToast } from "@/components/Toast";
import { EmailViewer } from "@/components/EmailViewer";
import { useFocusMode } from "@/lib/store";
import { LABEL_META, PRIORITY_META, timeAgo } from "@/lib/format";
import { getGreeting } from "@/lib/greeting";

type MainTab = "all" | "unread" | "others";

const PRIORITY_FILTERS: EmailPriority[] = ["urgent", "needs_reply", "waiting", "fyi", "newsletter"];

/* Bright accent bar per priority — gives the list colour like the reference. */
const PRIORITY_BAR: Record<EmailPriority, string> = {
  urgent: "var(--urgent)",
  needs_reply: "var(--hover)",
  waiting: "var(--pop-amber)",
  fyi: "var(--pop-blue)",
  newsletter: "var(--pop-pink)",
};

const SNOOZE_PRESETS = [
  { label: "3 hours", ms: 3 * 3600_000 },
  { label: "This evening", evening: true },
  { label: "Tomorrow 9am", tomorrow: true },
  { label: "Next week", ms: 7 * 24 * 3600_000 },
];

/* Avatar colour from a string — deterministic bright tint, never olive. */
const AVATAR_COLORS = ["var(--pop-cyan)", "var(--pop-amber)", "var(--pop-pink)", "var(--pop-blue)", "var(--hover)"];
function senderName(from: string) {
  return from.replace(/<.*>/, "").replace(/"/g, "").trim() || from;
}
function senderEmail(from: string) {
  return from.match(/<(.*)>/)?.[1] ?? from;
}
function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
function colorFor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
function dayBucket(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const t = d.getTime();
  if (t >= startToday) return "Today";
  if (t >= startToday - 86_400_000) return "Yesterday";
  return "Earlier";
}

function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const color = colorFor(name);
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full text-xs font-semibold"
      style={{ width: size, height: size, background: `rgb(${color} / 0.18)`, color: `rgb(${color})` }}
    >
      {initials(name)}
    </span>
  );
}

export default function InboxPage() {
  const { me } = useMe();
  const [mainTab, setMainTab] = useState<MainTab>("all");
  const [priority, setPriority] = useState<EmailPriority | null>(null);
  const [label, setLabel] = useState<string | null>(null);
  const [followUps, setFollowUps] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<EmailSummaryDto | null>(null);
  const [composing, setComposing] = useState(false);
  const [cursor, setCursor] = useState(0);
  const focus = useFocusMode();
  const toast = useToast();

  // greeting computed client-side to avoid SSR/CSR mismatch
  const [greeting, setGreeting] = useState("Welcome");
  useEffect(() => {
    setGreeting(getGreeting());
  }, []);

  const list = useAsync(
    () =>
      followUps
        ? api.followUps()
        : api.inbox({ priority: priority ?? undefined, label: label ?? undefined }),
    [priority, label, followUps],
  );

  // base set after focus-mode + search (tab counts read from this)
  const base = useMemo(() => {
    let e = list.data ?? [];
    if (focus) e = e.filter((m) => m.priority === "urgent" || m.priority === "needs_reply");
    if (query.trim()) {
      const q = query.toLowerCase();
      e = e.filter(
        (m) =>
          m.subject.toLowerCase().includes(q) ||
          m.from.toLowerCase().includes(q) ||
          m.snippet.toLowerCase().includes(q),
      );
    }
    return e;
  }, [list.data, focus, query]);

  const unreadCount = base.filter((m) => m.unread).length;
  const othersCount = base.length - unreadCount;

  const emails = useMemo(() => {
    if (mainTab === "unread") return base.filter((m) => m.unread);
    if (mainTab === "others") return base.filter((m) => !m.unread);
    return base;
  }, [base, mainTab]);

  const grouped = useMemo(() => {
    const g: Record<string, EmailSummaryDto[]> = { Today: [], Yesterday: [], Earlier: [] };
    for (const m of emails) g[dayBucket(m.receivedAt)].push(m);
    return g;
  }, [emails]);

  async function sync() {
    toast("Syncing inbox…", "info");
    try {
      const { synced } = await api.syncInbox();
      toast(`Synced ${synced} messages — classified & embedded`, "success");
      list.reload();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Sync failed", "error");
    }
  }

  async function snooze(email: EmailSummaryDto, preset: (typeof SNOOZE_PRESETS)[number]) {
    let until: Date;
    if (preset.evening) {
      until = new Date();
      until.setHours(18, 0, 0, 0);
      if (until.getTime() < Date.now()) until.setDate(until.getDate() + 1);
    } else if (preset.tomorrow) {
      until = new Date();
      until.setDate(until.getDate() + 1);
      until.setHours(9, 0, 0, 0);
    } else {
      until = new Date(Date.now() + (preset.ms ?? 0));
    }
    await api.snooze({ emailId: email.id, until: until.toISOString() });
    toast(`Snoozed until ${until.toLocaleString()}`, "success");
    setSelected(null);
    list.reload();
  }

  useShortcuts({
    j: () => setCursor((c) => Math.min(c + 1, emails.length - 1)),
    k: () => setCursor((c) => Math.max(c - 1, 0)),
    enter: () => emails[cursor] && setSelected(emails[cursor]),
    o: () => emails[cursor] && setSelected(emails[cursor]),
    u: () => setSelected(null),
    c: () => setComposing(true),
  });

  const TABS: { key: MainTab; label: string; count?: number }[] = [
    { key: "all", label: "All mail" },
    { key: "unread", label: "Unread", count: unreadCount },
    { key: "others", label: "Others", count: othersCount },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      {/* greeting header */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <h1 className="font-display text-2xl font-bold">
            {greeting}
            {me?.name ? `, ${me.name.split(" ")[0]}` : ""}
          </h1>
          <span className="text-sm text-muted">{base.length.toLocaleString()} emails</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative hidden sm:block">
            <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
            <input
              className="input !w-56 pl-9"
              placeholder="Search anything…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button className="btn-primary" onClick={() => setComposing(true)}>
            <PaperPlaneTilt className="h-4 w-4" weight="fill" /> Compose
          </button>
        </div>
      </header>

      {/* main tabs + filter toggle */}
      <div className="mt-5 flex items-center justify-between border-b border-line">
        <div className="flex items-center gap-1">
          {TABS.map((t) => {
            const on = mainTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => {
                  setMainTab(t.key);
                  setCursor(0);
                }}
                className={`relative -mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm transition-colors ${
                  on ? "border-[rgb(var(--hover))] font-semibold text-ink" : "border-transparent text-muted hover:text-ink"
                }`}
              >
                {t.label}
                {t.count !== undefined && (
                  <span
                    className={`rounded-full px-1.5 text-[10px] font-semibold ${
                      on ? "bg-[rgb(var(--hover)/0.16)] text-[rgb(var(--hover))]" : "bg-surface-2 text-muted"
                    }`}
                  >
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <button
          className={`mb-1 grid h-8 w-8 place-items-center rounded-lg border border-line transition-colors ${
            filtersOpen || priority || label || followUps ? "text-[rgb(var(--hover))]" : "text-muted hover:text-ink"
          }`}
          onClick={() => setFiltersOpen((v) => !v)}
          aria-label="Filters"
          title="Filter by label / priority"
        >
          <FunnelSimple className="h-4 w-4" />
        </button>
      </div>

      {/* secondary filters */}
      {filtersOpen && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setFollowUps((v) => !v);
              setPriority(null);
            }}
            className={`chip border ${followUps ? "border-accent/40 bg-accent/15 text-accent" : "border-line bg-surface text-muted hover:text-ink"}`}
          >
            ⏰ Follow-ups
          </button>
          <span className="mx-1 h-4 w-px bg-line" />
          {PRIORITY_FILTERS.map((p) => (
            <button
              key={p}
              onClick={() => {
                setPriority(priority === p ? null : p);
                setFollowUps(false);
              }}
              className={`chip border ${priority === p ? `border-transparent ${PRIORITY_META[p].cls}` : "border-line bg-surface text-muted hover:text-ink"}`}
            >
              {PRIORITY_META[p].label}
            </button>
          ))}
          <span className="mx-1 h-4 w-px bg-line" />
          {(["client", "invoice", "interview", "project"] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLabel(label === l ? null : l)}
              className={`chip border ${label === l ? `border-transparent ${LABEL_META[l]}` : "border-line bg-surface text-faint hover:text-ink"}`}
            >
              #{l}
            </button>
          ))}
          <button className="btn-ghost !px-3 !py-1 text-xs" onClick={sync} title="Sync now">
            ⟳ Sync
          </button>
        </div>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        {/* list */}
        <div className={selected ? "hidden lg:col-span-2 lg:block" : "lg:col-span-2"}>
          <div className="overflow-hidden rounded-2xl border border-line bg-surface">
            {list.loading && <p className="py-10 text-center text-sm text-muted animate-pulse">loading…</p>}
            {!list.loading && emails.length === 0 && (
              <p className="py-10 text-center text-sm text-muted">
                {followUps ? "No threads waiting on a reply. ✨" : "Nothing here in this view."}
              </p>
            )}
            {(["Today", "Yesterday", "Earlier"] as const).map((bucket) =>
              grouped[bucket].length === 0 ? null : (
                <div key={bucket}>
                  <p className="border-b border-line bg-bg/40 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-faint">
                    {bucket}
                  </p>
                  <ul className="divide-y divide-line">
                    {grouped[bucket].map((m) => {
                      const name = senderName(m.from);
                      const on = selected?.id === m.id;
                      return (
                        <li key={m.id}>
                          <button
                            onClick={() => {
                              setSelected(m);
                              setCursor(emails.indexOf(m));
                            }}
                            style={{
                              borderLeftColor: on
                                ? "rgb(var(--hover))"
                                : m.priority
                                  ? PRIORITY_BAR[m.priority]
                                  : "transparent",
                            }}
                            className={`flex w-full gap-3 border-l-[3px] px-3.5 py-3 text-left transition-colors ${
                              on ? "bg-surface-2" : "hover:bg-surface-2"
                            }`}
                          >
                            <Avatar name={name} />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className={`truncate text-sm ${m.unread ? "font-semibold text-ink" : "text-ink"}`}>
                                  {name}
                                </span>
                                <span className="shrink-0 text-[11px] text-faint">{timeAgo(m.receivedAt)}</span>
                              </div>
                              <p className={`truncate text-sm ${m.unread ? "font-medium text-ink" : "text-muted"}`}>
                                {m.subject}
                              </p>
                              <p className="truncate text-xs text-faint">{m.snippet}</p>
                              {(m.priority || (m.smartLabel && m.smartLabel !== "none") || m.hasReminder) && (
                                <div className="mt-1.5 flex flex-wrap gap-1.5">
                                  {m.priority && (
                                    <span className={`chip ${PRIORITY_META[m.priority].cls}`}>
                                      {PRIORITY_META[m.priority].label}
                                    </span>
                                  )}
                                  {m.smartLabel && m.smartLabel !== "none" && (
                                    <span className={`chip ${LABEL_META[m.smartLabel]}`}>#{m.smartLabel}</span>
                                  )}
                                  {m.hasReminder && <span className="chip bg-surface-2 text-muted">⏰</span>}
                                </div>
                              )}
                            </div>
                            {m.unread && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[rgb(var(--hover))]" />}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ),
            )}
          </div>
        </div>

        {/* preview pane */}
        <div className={selected ? "lg:col-span-3" : "hidden lg:col-span-3 lg:block"}>
          {selected ? (
            <ThreadPane
              email={selected}
              onClose={() => setSelected(null)}
              onSnooze={(p) => snooze(selected, p)}
              onChanged={() => list.reload()}
            />
          ) : (
            <div className="grid h-full min-h-[360px] place-items-center rounded-2xl border border-dashed border-line bg-surface/50 p-10 text-center">
              <div>
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-accent-soft text-accent">
                  <PaperPlaneTilt className="h-5 w-5" />
                </span>
                <p className="mt-3 text-sm font-medium">Select an email to preview</p>
                <p className="mt-1 text-xs text-muted">The full thread opens right here — no tab switching.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {composing && <ComposeModal onClose={() => setComposing(false)} onSent={() => list.reload()} />}
    </div>
  );
}

function ThreadPane({
  email,
  onClose,
  onSnooze,
  onChanged,
}: {
  email: EmailSummaryDto;
  onClose: () => void;
  onSnooze: (p: (typeof SNOOZE_PRESETS)[number]) => void;
  onChanged: () => void;
}) {
  const thread = useAsync(() => api.thread(email.threadId), [email.threadId]);
  const toast = useToast();
  const [draft, setDraft] = useState<string | null>(null);
  const [drafting, setDrafting] = useState(false);
  const [snoozeOpen, setSnoozeOpen] = useState(false);
  const name = senderName(email.from);

  async function makeDraft(kind: "reply" | "followup") {
    setDrafting(true);
    try {
      const r =
        kind === "reply" ? await api.draftReply({ threadId: email.threadId }) : await api.followUp(email.threadId);
      setDraft(r.draft);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Draft failed", "error");
    } finally {
      setDrafting(false);
    }
  }

  async function send() {
    if (!draft) return;
    try {
      const { jobId, undoUntil } = await api.send({
        to: [email.from],
        subject: email.subject.startsWith("Re:") ? email.subject : `Re: ${email.subject}`,
        body: draft,
        threadId: email.threadId,
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

  async function extractTasks() {
    try {
      const tasks = await api.extractTasks(email.threadId);
      toast(
        tasks.length ? `Extracted ${tasks.length} task(s) → board` : "No action items found",
        tasks.length ? "success" : "info",
      );
      onChanged();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Extraction failed", "error");
    }
  }

  async function createEventFromHint() {
    const hint = thread.data?.meetingHint;
    if (!hint) return;
    try {
      const start = new Date(hint.start);
      const end = new Date(start.getTime() + 30 * 60_000);
      await api.createEvent({ title: hint.title, start: start.toISOString(), end: end.toISOString(), attendees: hint.attendees });
      toast("Event created — invites sent to the thread participants", "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Event creation failed", "error");
    }
  }

  useShortcuts({
    r: () => makeDraft("reply"),
    s: () => setSnoozeOpen((v) => !v),
    e: () => extractTasks(),
  });

  return (
    <div className="card p-5">
      {/* header: back + subject */}
      <div className="flex items-center gap-2">
        <button className="grid h-8 w-8 place-items-center rounded-lg text-faint hover:bg-surface-2 hover:text-ink" onClick={onClose} title="Back (u)">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h2 className="min-w-0 flex-1 truncate font-display text-lg font-semibold">{email.subject}</h2>
      </div>

      {/* sender identity + recipients */}
      <div className="mt-3 flex items-start gap-3 border-b border-line pb-4">
        <Avatar name={name} size={40} />
        <div className="min-w-0 flex-1 text-xs">
          <p className="text-sm">
            <span className="font-semibold text-ink">{name}</span>{" "}
            <span className="text-faint">{senderEmail(email.from)}</span>
          </p>
          {email.to.length > 0 && (
            <p className="mt-0.5 text-muted">
              To: <span className="text-ink">{email.to.join(", ")}</span>
            </p>
          )}
          <p className="mt-0.5 text-faint">{new Date(email.receivedAt).toLocaleString()}</p>
        </div>
      </div>

      {thread.data?.meetingHint && (
        <button
          onClick={createEventFromHint}
          className="mt-3 flex w-full items-center gap-2 rounded-xl border border-accent/40 bg-accent/5 px-3 py-2 text-left text-sm text-accent hover:bg-accent/10"
        >
          ▦ Meeting detected: “{thread.data.meetingHint.title}” — {new Date(thread.data.meetingHint.start).toLocaleString()}.
          <span className="ml-auto shrink-0 font-semibold">Create event →</span>
        </button>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <button className="btn-ghost !px-3 !py-1.5 text-xs" onClick={() => makeDraft("reply")} disabled={drafting}>
          {drafting ? "drafting…" : "↩ AI reply"} <span className="kbd">r</span>
        </button>
        <button className="btn-ghost !px-3 !py-1.5 text-xs" onClick={() => makeDraft("followup")} disabled={drafting}>
          👋 Checking in
        </button>
        <div className="relative">
          <button className="btn-ghost !px-3 !py-1.5 text-xs" onClick={() => setSnoozeOpen((v) => !v)}>
            ◷ Snooze <span className="kbd">s</span>
          </button>
          {snoozeOpen && (
            <div className="card absolute z-10 mt-1 w-44 p-1.5">
              {SNOOZE_PRESETS.map((p) => (
                <button
                  key={p.label}
                  className="block w-full rounded-lg px-3 py-1.5 text-left text-xs text-ink hover:bg-surface-2"
                  onClick={() => onSnooze(p)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <button className="btn-ghost !px-3 !py-1.5 text-xs" onClick={extractTasks}>
          ✓ Extract tasks <span className="kbd">e</span>
        </button>
        <button
          className="btn-ghost !px-3 !py-1.5 text-xs"
          onClick={async () => {
            const remindAt = new Date(Date.now() + 24 * 3600_000).toISOString();
            await api.reminder({ threadId: email.threadId, remindAt });
            toast("Reminder set for tomorrow", "success");
          }}
        >
          ⏰ Remind me
        </button>
      </div>

      {draft !== null && (
        <div className="mt-4 rounded-xl border border-accent/30 bg-surface-2 p-3">
          <p className="mb-2 text-[11px] text-muted">AI draft — edit freely. Nothing sends until you click; 30s undo.</p>
          <textarea className="input h-36 resize-none" value={draft} onChange={(e) => setDraft(e.target.value)} />
          <div className="mt-2 flex justify-end gap-2">
            <button className="btn-ghost !py-1.5 text-xs" onClick={() => setDraft(null)}>
              Discard
            </button>
            <button className="btn-primary !py-1.5 text-xs" onClick={send}>
              Send with undo
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 space-y-4">
        {thread.loading && <p className="text-sm text-muted animate-pulse">loading thread…</p>}
        {thread.data?.messages.map((m) => (
          <div key={m.id} className="rounded-xl border border-line bg-bg p-3">
            <div className="mb-1.5 flex items-baseline justify-between text-xs text-muted">
              <span className="font-medium text-ink">{senderName(m.from)}</span>
              <span className="font-mono">{new Date(m.date).toLocaleString()}</span>
            </div>
            <EmailViewer html={m.html} text={m.text} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ComposeModal({ onClose, onSent }: { onClose: () => void; onSent: () => void }) {
  const toast = useToast();
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const recipients = to
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (recipients.length === 0) {
      toast("Add at least one recipient", "error");
      return;
    }
    setBusy(true);
    try {
      const { jobId, undoUntil } = await api.send({ to: recipients, subject, body });
      const secs = Math.max(1, Math.round((new Date(undoUntil).getTime() - Date.now()) / 1000));
      toast(
        `Sending in ${secs}s…`,
        "info",
        { label: "Undo", onClick: () => api.undoSend(jobId).then(() => toast("Send cancelled", "success")) },
        secs * 1000,
      );
      onSent();
      onClose();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Send failed", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-6 backdrop-blur-sm" onClick={onClose}>
      <form className="card w-full max-w-lg space-y-3 p-6" onClick={(e) => e.stopPropagation()} onSubmit={send}>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">New message</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-faint hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        </div>
        <input className="input" placeholder="To (comma-separated emails)" value={to} onChange={(e) => setTo(e.target.value)} />
        <input className="input" placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
        <textarea
          className="input h-48 resize-none"
          placeholder="Write your message…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" disabled={busy}>
            <PaperPlaneTilt className="h-4 w-4" weight="fill" /> {busy ? "Sending…" : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}
