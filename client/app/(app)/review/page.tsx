"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useAsync } from "@/lib/hooks";
import { useToast } from "@/components/Toast";
import { timeAgo } from "@/lib/format";

export default function ReviewPage() {
  const queue = useAsync(() => api.reviewQueue());
  const slack = useAsync(() => api.slackChannels());
  const toast = useToast();
  const [summary, setSummary] = useState<{ channel: string; summary: string; actionItems: string[] } | null>(null);
  const [busyChannel, setBusyChannel] = useState<string | null>(null);

  async function catchUp(channelId: string, name: string) {
    setBusyChannel(channelId);
    try {
      const r = await api.slackCatchUp(channelId);
      setSummary({ channel: name, ...r });
    } catch (e) {
      toast(e instanceof Error ? e.message : "Catch-up failed", "error");
    } finally {
      setBusyChannel(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-2xl font-bold">Review queue</h1>
      <p className="mt-1 text-sm text-muted">
        PRs and conversations waiting on you — with AI briefings so you can triage in seconds.
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* GitHub PRs — cyan */}
        <section
          className="rounded-2xl border border-line border-t-4 bg-surface p-5"
          style={{ borderTopColor: "rgb(var(--hover))" }}
        >
          <h2 className="flex items-center gap-2 font-display text-sm font-semibold" style={{ color: "rgb(var(--hover))" }}>
            <span className="grid h-6 w-6 place-items-center rounded-md" style={{ background: "rgb(var(--hover) / 0.16)" }}>
              ⎇
            </span>
            GitHub — PRs awaiting review
          </h2>
          {queue.loading && <p className="mt-3 text-sm text-muted animate-pulse">loading…</p>}
          {queue.data && (
            <>
              {queue.data.briefing && (
                <p className="mt-3 whitespace-pre-wrap rounded-xl bg-surface-2 p-3 text-sm text-muted">
                  {queue.data.briefing}
                </p>
              )}
              <div className="mt-3 grid gap-2.5">
                {queue.data.prs.map((pr) => {
                  const stale = pr.updatedAt ? Date.now() - new Date(pr.updatedAt).getTime() > 48 * 3600_000 : false;
                  return (
                    <div
                      key={pr.id}
                      className="rounded-xl border border-line border-l-4 bg-bg p-3"
                      style={{ borderLeftColor: "rgb(var(--hover))" }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{pr.title}</p>
                        {stale ? (
                          <span className="chip bg-urgent/15 text-urgent">urgent · stale &gt;48h</span>
                        ) : (
                          <span className="chip bg-[rgb(var(--hover)/0.15)] text-[rgb(var(--hover))]">review</span>
                        )}
                      </div>
                      <p className="mt-0.5 font-mono text-[11px] text-faint">
                        {pr.repo}
                        {pr.updatedAt ? ` · updated ${timeAgo(pr.updatedAt)}` : ""}
                      </p>
                      <div className="mt-2.5">
                        <a className="btn-ghost !px-3 !py-1.5 text-xs" href={pr.url} target="_blank" rel="noreferrer">
                          Review on GitHub ↗
                        </a>
                      </div>
                    </div>
                  );
                })}
                {queue.data.prs.length === 0 && <p className="text-sm text-muted">Queue is clear. 🎉</p>}
              </div>
            </>
          )}
          {queue.error && (
            <p className="mt-3 text-sm text-muted">
              Connect GitHub on the{" "}
              <a href="/connections" className="text-accent hover:underline">
                connections page
              </a>{" "}
              to see your review queue.
            </p>
          )}
        </section>

        {/* Slack — pink */}
        <section
          className="rounded-2xl border border-line border-t-4 bg-surface p-5"
          style={{ borderTopColor: "rgb(var(--pop-pink))" }}
        >
          <h2 className="flex items-center gap-2 font-display text-sm font-semibold" style={{ color: "rgb(var(--pop-pink))" }}>
            <span className="grid h-6 w-6 place-items-center rounded-md" style={{ background: "rgb(var(--pop-pink) / 0.16)" }}>
              💬
            </span>
            Slack — your channels
          </h2>
          {slack.error && (
            <p className="mt-3 text-sm text-muted">
              Connect Slack on the{" "}
              <a href="/connections" className="text-accent hover:underline">
                connections page
              </a>{" "}
              for channel catch-ups.
            </p>
          )}
          <div className="mt-3 grid gap-2.5">
            {(slack.data ?? []).map((c) => (
              <div
                key={c.channelId}
                className="rounded-xl border border-line border-l-4 bg-bg p-3"
                style={{ borderLeftColor: "rgb(var(--pop-pink))" }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium text-ink">#{c.name}</span>
                  <span className="chip bg-[rgb(var(--pop-pink)/0.14)] text-[rgb(var(--pop-pink))]">{c.members} members</span>
                </div>
                <div className="mt-2.5">
                  <button
                    className="btn-ghost !px-3 !py-1.5 text-xs"
                    onClick={() => catchUp(c.channelId, c.name)}
                    disabled={busyChannel === c.channelId}
                  >
                    {busyChannel === c.channelId ? "summarizing…" : "⚡ Catch up"}
                  </button>
                </div>
              </div>
            ))}
            {slack.data?.length === 0 && (
              <p className="text-sm text-muted">No channels cached yet — connect Slack, then catch up.</p>
            )}
          </div>

          {summary && (
            <div className="mt-4 rounded-xl border border-[rgb(var(--pop-pink)/0.3)] bg-surface-2 p-4">
              <h3 className="text-sm font-semibold" style={{ color: "rgb(var(--pop-pink))" }}>
                #{summary.channel} in 10 seconds
              </h3>
              <p className="mt-2 whitespace-pre-wrap text-sm text-ink">{summary.summary}</p>
              {summary.actionItems.length > 0 && (
                <>
                  <h4 className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted">Action items</h4>
                  <ul className="mt-1 space-y-1.5">
                    {summary.actionItems.map((a, i) => (
                      <li key={i} className="flex items-center justify-between gap-3 text-sm text-ink">
                        <span>• {a}</span>
                        <button
                          className="kbd hover:text-accent"
                          onClick={async () => {
                            await api.createTask({ title: a });
                            toast("Added to task board", "success");
                          }}
                        >
                          + task
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
