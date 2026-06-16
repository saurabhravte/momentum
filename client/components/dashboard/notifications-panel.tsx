"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Note = {
  id: string;
  title: string;
  body: string;
  time: string;
  unread?: boolean;
};

/**
 * Collapsible notifications drawer that lives on the right edge of the
 * dashboard. The bell is the toggle: click to open, click the bell or X (or
 * the backdrop) to close. Replace SAMPLE with live data from lib/queries when
 * a notifications endpoint exists.
 */
const SAMPLE: Note[] = [
  { id: "1", title: "Slack connected", body: "Your Slack workspace is now syncing.", time: "just now", unread: true },
  {
    id: "2",
    title: "Action awaiting approval",
    body: "Draft reply to Priya is ready to send.",
    time: "12m",
    unread: true,
  },
  { id: "3", title: "Weekly summary", body: "Your Monday digest is ready to read.", time: "2h" },
];

export function NotificationsPanel() {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState<Note[]>(SAMPLE);
  const unread = notes.filter((n) => n.unread).length;

  // Close on Escape for keyboard users.
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
            {unread}
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
              className="fixed inset-0 z-40 bg-ink/20 backdrop-blur-[1px]"
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
                  {unread > 0 && (
                    <button
                      type="button"
                      onClick={() => setNotes((ns) => ns.map((n) => ({ ...n, unread: false })))}
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
                {notes.length === 0 ? (
                  <p className="px-3 py-10 text-center text-sm text-faint">You&apos;re all caught up.</p>
                ) : (
                  <ul className="space-y-1">
                    {notes.map((n) => (
                      <li
                        key={n.id}
                        className={cn(
                          "rounded-xl px-3 py-2.5 transition-colors hover:bg-surface-2",
                          n.unread && "bg-accent-soft/60",
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-medium">{n.title}</span>
                          <span className="shrink-0 text-[11px] text-faint">{n.time}</span>
                        </div>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted">{n.body}</p>
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
