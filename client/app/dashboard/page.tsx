"use client";

import { Mail, Calendar, Inbox, CalendarClock, CheckSquare, Plug, ArrowUpRight, RotateCcw } from "lucide-react";
import Link from "next/link";
import { BentoCard } from "@/components/dashboard/bento-card";
import { ProgressChart, type ProgressPoint } from "@/components/dashboard/progress-chart";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { StatusBadge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { useFetch } from "@/lib/use-fetch";
import { cn } from "@/lib/utils";

/* ---- Backend contract (adjust paths/fields to match your server) ----
   GET /api/connections  -> { providers: { gmail, googlecalendar, slack, github } }
   GET /api/dashboard/overview -> { unread, meetingsToday, openTasks }
   GET /api/activity?limit=5   -> { items: [{ id, level, title, message }] }
------------------------------------------------------------------------- */
const ENDPOINTS = {
  connections: "/api/connections",
  overview: "/api/dashboard/overview",
  activity: "/api/activity?limit=5",
};

type Providers = Record<"gmail" | "googlecalendar" | "slack" | "github", boolean>;
type Overview = { unread: number; meetingsToday: number; openTasks: number };
type Activity = {
  items: { id: string; level: "success" | "warning" | "error" | "neutral"; title: string; message: string }[];
};

const SlackIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
  </svg>
);

const GithubIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.341-3.369-1.341-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.741 0 .267.18.579.688.481C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
  </svg>
);

const TOOLS: {
  key: keyof Providers;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}[] = [
  { key: "gmail", name: "Gmail", icon: Mail, color: "#EA4335" },
  { key: "googlecalendar", name: "Calendar", icon: Calendar, color: "#1A73E8" },
  { key: "slack", name: "Slack", icon: SlackIcon, color: "#611F69" },
  { key: "github", name: "GitHub", icon: GithubIcon, color: "#24292F" },
];

function Stat({
  icon: Icon,
  label,
  value,
  loading,
}: {
  icon: typeof Inbox;
  label: string;
  value?: number;
  loading: boolean;
}) {
  return (
    <BentoCard>
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-surface-2 text-ink">
        <Icon className="h-4 w-4" />
      </span>
      <p className="mt-4 text-sm text-muted">{label}</p>
      {loading ? (
        <span className="mt-1 block h-7 w-12 animate-pulse rounded bg-surface-2" />
      ) : (
        <p className="text-2xl font-semibold tracking-tight">{value ?? "—"}</p>
      )}
    </BentoCard>
  );
}

export default function DashboardPage() {
  const conn = useFetch<Providers>(ENDPOINTS.connections);
  const overview = useFetch<Overview>(ENDPOINTS.overview);
  const activity = useFetch<Activity>(ENDPOINTS.activity);
  const stats = useFetch<{ series: ProgressPoint[] }>("/api/tasks/stats?days=14");

  const providers = conn.data;
  const connectedCount = providers ? Object.values(providers).filter(Boolean).length : 0;
  const hasAnyConnection = connectedCount > 0;

  async function toggleTool(key: string, currentlyOn: boolean) {
    try {
      if (currentlyOn) {
        await api.disconnect(key);
        conn.reload();
      } else {
        const res = await api.connect(key);
        // OAuth providers (gmail/calendar) redirect to consent; key providers need the modal.
        if (res.redirectUrl) window.location.href = res.redirectUrl;
        else window.location.href = `/connections?focus=${key}`;
      }
    } catch {
      conn.reload();
    }
  }

  return (
    <div className="space-y-4">
      {/* Empty state — only when we know nothing is connected */}
      {!conn.loading && !conn.error && !hasAnyConnection && (
        <BentoCard className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-surface-2 text-ink">
              <Plug className="h-5 w-5" />
            </span>
            <div>
              <p className="font-medium">Nothing connected yet</p>
              <p className="text-sm text-muted">Connect a tool to start seeing your day here.</p>
            </div>
          </div>
          <Link href="/connections" className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-bg">
            Connect tools
          </Link>
        </BentoCard>
      )}

      {/* Stat row — dynamic counts */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat
          icon={Plug}
          label="Connected tools"
          value={hasAnyConnection ? connectedCount : undefined}
          loading={conn.loading}
        />
        <Stat icon={Inbox} label="Unread" value={overview.data?.unread} loading={overview.loading} />
        <Stat
          icon={CalendarClock}
          label="Meetings today"
          value={overview.data?.meetingsToday}
          loading={overview.loading}
        />
        <Stat icon={CheckSquare} label="Open tasks" value={overview.data?.openTasks} loading={overview.loading} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Connected tools — dynamic status from /api/connections */}
        <BentoCard className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-medium">Your tools</h2>
            <Link href="/connections" className="text-xs text-muted hover:text-ink">
              Manage
            </Link>
          </div>

          {conn.error ? (
            <ErrorRow message={conn.error} onRetry={conn.reload} />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {TOOLS.map((t) => {
                const isOn = Boolean(providers?.[t.key]);
                return (
                  <div key={t.key} className="flex flex-col items-start gap-3 rounded-lg border border-line bg-bg p-3">
                    <div className="flex w-full items-start justify-between">
                      <span className="grid h-9 w-9 place-items-center rounded-lg bg-surface-2 text-ink">
                        <t.icon className="h-4 w-4" />
                      </span>
                      <button
                        type="button"
                        disabled={conn.loading}
                        onClick={() => toggleTool(t.key, isOn)}
                        className={cn(
                          "rounded-md px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50",
                          isOn
                            ? "border border-line text-muted hover:text-ink"
                            : "bg-accent text-bg hover:opacity-90",
                        )}
                      >
                        {conn.loading ? "…" : isOn ? "Resync" : "Connect"}
                      </button>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{t.name}</p>
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                        <span
                          className={cn("h-1.5 w-1.5 rounded-full", conn.loading && "animate-pulse")}
                          style={{ background: isOn ? t.color : "rgb(var(--faint))" }}
                        />
                        {conn.loading ? "Checking" : isOn ? "Connected" : "Not connected"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </BentoCard>

        {/* Activity — dynamic, with bright pills as the only color */}
        <BentoCard>
          <h2 className="mb-4 font-medium">Recent activity</h2>
          {activity.error ? (
            <ErrorRow message={activity.error} onRetry={activity.reload} />
          ) : activity.loading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <span key={i} className="block h-8 animate-pulse rounded-full bg-surface-2" />
              ))}
            </div>
          ) : activity.data && activity.data.items.length > 0 ? (
            <div className="space-y-2.5">
              {activity.data.items.map((a) => (
                <StatusBadge key={a.id} variant={a.level} label={a.title} withArrow={false}>
                  {a.message}
                </StatusBadge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">No activity yet. Actions you approve will show up here.</p>
          )}
        </BentoCard>
      </div>

      {/* Summary (daily/weekly/monthly toggle) + daily progress graph */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SummaryCard />
        <ProgressChart data={stats.data?.series} loading={stats.loading} />
      </div>

      {/* Catch Me Up — neutral, action button stays black */}
      <BentoCard className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-medium">Catch me up</h2>
          <p className="text-sm text-muted">
            Summarize everything that happened across your connected tools while you were away.
          </p>
        </div>
        <button
          disabled={!hasAnyConnection}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium",
            hasAnyConnection ? "bg-ink text-bg" : "cursor-not-allowed bg-surface-2 text-faint",
          )}
        >
          Run catch-up <ArrowUpRight className="h-4 w-4" />
        </button>
      </BentoCard>
    </div>
  );
}

function ErrorRow({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-rose-500/20 bg-rose-500/5 p-3">
      <p className="text-sm text-rose-600 dark:text-rose-400">Couldn&apos;t load — {message}</p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-xs font-medium text-bg"
      >
        <RotateCcw className="h-3.5 w-3.5" /> Retry
      </button>
    </div>
  );
}
