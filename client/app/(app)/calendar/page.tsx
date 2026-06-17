"use client";

import { useMemo, useState } from "react";
import { CaretLeft, CaretRight, MagnifyingGlass, Plus } from "@phosphor-icons/react";
import type { EventDto } from "@momentum/shared";
import { api } from "@/lib/api";
import { useAsync } from "@/lib/hooks";
import { useToast } from "@/components/Toast";
import { fmtDay, fmtTime } from "@/lib/format";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export default function CalendarPage() {
  const [cursor, setCursor] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });
  const [query, setQuery] = useState("");
  const [briefFor, setBriefFor] = useState<EventDto | null>(null);
  const [creating, setCreating] = useState(false);
  const toast = useToast();

  // Build a 6-week grid starting on the Sunday on/before the 1st.
  const gridStart = useMemo(() => {
    const first = new Date(cursor);
    const d = new Date(first);
    d.setDate(first.getDate() - first.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
  }, [cursor]);
  const cells = useMemo(
    () => Array.from({ length: 42 }, (_, i) => new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i)),
    [gridStart],
  );
  const gridEnd = cells[41];

  // Fetch events for the visible range (already proxies Google Calendar server-side).
  const events = useAsync(
    () => api.events({ from: gridStart.toISOString(), to: new Date(gridEnd.getTime() + 86_400_000).toISOString() }),
    [gridStart.getTime()],
  );

  const filtered = (events.data ?? []).filter((e) =>
    query.trim() ? e.title.toLowerCase().includes(query.trim().toLowerCase()) : true,
  );
  const eventsFor = (day: Date) =>
    filtered
      .filter((e) => sameDay(new Date(e.start), day))
      .sort((a, b) => +new Date(a.start) - +new Date(b.start));

  const today = new Date();
  const monthLabel = cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const shift = (n: number) => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + n, 1));
  const goToday = () => {
    const n = new Date();
    setCursor(new Date(n.getFullYear(), n.getMonth(), 1));
  };

  return (
    <div className="mx-auto max-w-6xl">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button className="rounded-lg border border-line p-2 hover:bg-surface-2" onClick={() => shift(-1)} aria-label="Previous month">
            <CaretLeft className="h-4 w-4" />
          </button>
          <button className="rounded-lg border border-line p-2 hover:bg-surface-2" onClick={() => shift(1)} aria-label="Next month">
            <CaretRight className="h-4 w-4" />
          </button>
          <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={goToday}>
            Today
          </button>
          <h1 className="ml-2 font-display text-xl font-bold">{monthLabel}</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
            <input
              className="input !w-56 pl-9"
              placeholder="Search events"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button className="btn-primary" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" weight="bold" /> New Event
          </button>
        </div>
      </header>

      {events.loading && <p className="mt-4 animate-pulse text-sm text-muted">loading events…</p>}

      {/* Month grid */}
      <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="grid grid-cols-7 border-b border-line">
          {WEEKDAYS.map((d) => (
            <div key={d} className="px-3 py-2 text-center text-xs font-medium text-muted">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            const inMonth = day.getMonth() === cursor.getMonth();
            const isToday = sameDay(day, today);
            const dayEvents = eventsFor(day);
            return (
              <div
                key={i}
                className={`min-h-[112px] border-b border-r border-line p-1.5 ${i % 7 === 6 ? "border-r-0" : ""} ${
                  inMonth ? "bg-surface" : "bg-bg/40"
                }`}
              >
                <div className="flex justify-start">
                  <span
                    className={`grid h-6 min-w-6 place-items-center rounded-full px-1 text-xs ${
                      isToday
                        ? "bg-ink font-semibold text-bg"
                        : inMonth
                          ? "text-ink"
                          : "text-faint"
                    }`}
                  >
                    {day.getDate()}
                  </span>
                </div>
                <div className="mt-1 space-y-1">
                  {dayEvents.slice(0, 3).map((e) => (
                    <button
                      key={e.id}
                      onClick={() => setBriefFor(e)}
                      title={e.title}
                      className={`flex w-full items-center gap-1 truncate rounded px-1.5 py-0.5 text-left text-[11px] transition-colors hover:brightness-95 ${
                        e.conflict ? "bg-urgent/15 text-urgent" : "bg-accent/15 text-ink"
                      }`}
                    >
                      <span className="shrink-0 font-mono text-[10px] text-muted">{fmtTime(e.start)}</span>
                      <span className="truncate">{e.title}</span>
                    </button>
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="block px-1.5 text-[10px] text-muted">+{dayEvents.length - 3} more</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {!events.loading && filtered.length === 0 && (
        <p className="mt-4 text-center text-sm text-muted">
          No events this month. Connect Google Calendar or create one.
        </p>
      )}

      {briefFor && <BriefModal event={briefFor} onClose={() => setBriefFor(null)} />}
      {creating && (
        <CreateEventModal
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false);
            events.reload();
          }}
        />
      )}
    </div>
  );
}

function BriefModal({ event, onClose }: { event: EventDto; onClose: () => void }) {
  const brief = useAsync(() => api.brief(event.id), [event.id]);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/70 p-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="card max-h-[80vh] w-full max-w-lg overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-lg font-bold">📋 {event.title}</h2>
        <p className="mt-1 text-xs text-ink-400">
          {fmtDay(event.start)} · {fmtTime(event.start)}–{fmtTime(event.end)} · this brief is also pushed 10 min before
          the meeting
        </p>
        {brief.loading && <p className="mt-4 text-sm text-ink-400 animate-pulse-soft">assembling context…</p>}
        {brief.data && (
          <>
            <h3 className="mt-5 text-xs font-semibold uppercase tracking-wide text-accent">Participants</h3>
            <p className="mt-1 text-sm text-ink-200">{brief.data.attendees.join(", ") || "Just you"}</p>

            <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-accent">Recent threads with them</h3>
            <ul className="mt-1 space-y-1.5">
              {brief.data.recentEmails.map((h) => (
                <li key={h.id} className="rounded-lg bg-ink-850 px-3 py-2 text-sm">
                  <p className="truncate text-ink-100">{h.title}</p>
                  <p className="truncate text-xs text-ink-400">{h.snippet}</p>
                </li>
              ))}
              {brief.data.recentEmails.length === 0 && (
                <li className="text-sm text-ink-400">No recent email context.</li>
              )}
            </ul>

            <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-accent">Suggested talking points</h3>
            <ul className="mt-1 list-inside space-y-1 text-sm text-ink-200">
              {brief.data.talkingPoints.map((t, i) => (
                <li key={i}>• {t}</li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

function CreateEventModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [start, setStart] = useState("");
  const [duration, setDuration] = useState(30);
  const [attendees, setAttendees] = useState("");
  const [busy, setBusy] = useState(false);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const s = new Date(start);
      await api.createEvent({
        title,
        start: s.toISOString(),
        end: new Date(s.getTime() + duration * 60_000).toISOString(),
        attendees: attendees
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean),
      });
      toast("Event created — Google sends invites to all attendees", "success");
      onCreated();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not create event", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/70 p-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <form className="card w-full max-w-md space-y-3 p-6" onClick={(e) => e.stopPropagation()} onSubmit={create}>
        <h2 className="font-display text-lg font-bold">New event — one screen, zero hunting</h2>
        <input
          className="input"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <input
          className="input"
          type="datetime-local"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          required
        />
        <div className="flex gap-2">
          {[15, 30, 45, 60].map((d) => (
            <button
              type="button"
              key={d}
              onClick={() => setDuration(d)}
              className={`chip ${duration === d ? "bg-accent/15 text-accent" : "bg-ink-800 text-ink-300"}`}
            >
              {d}m
            </button>
          ))}
        </div>
        <input
          className="input"
          placeholder="Attendees (comma-separated emails)"
          value={attendees}
          onChange={(e) => setAttendees(e.target.value)}
        />
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" disabled={busy}>
            {busy ? "…" : "Create & invite"}
          </button>
        </div>
      </form>
    </div>
  );
}
