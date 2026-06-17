"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, ShieldAlert, Save, User, Bell, Plug, LogOut, Webhook, Copy, type LucideIcon } from "lucide-react";
import { api } from "@/lib/api";
import { useMe, useAsync } from "@/lib/hooks";
import { useToast } from "@/components/Toast";
import { Switch } from "@/components/ui/switch";

// A small, friendly set of common IANA zones. The user's current zone is always
// included even if it isn't in this list.
const COMMON_TZS = [
  "UTC",
  "Asia/Kolkata",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
];

type Settings = {
  weeklySummary: boolean;
  shutdownRitualHour: number;
  notificationBundleMinutes: number;
};

type TabKey = "profile" | "reports" | "verification" | "data" | "webhooks" | "session";
const TABS: { key: TabKey; label: string; Icon: LucideIcon }[] = [
  { key: "profile", label: "Profile", Icon: User },
  { key: "reports", label: "Reports", Icon: Bell },
  { key: "verification", label: "Verification", Icon: BadgeCheck },
  { key: "data", label: "Connected data", Icon: Plug },
  { key: "webhooks", label: "Webhooks", Icon: Webhook },
  { key: "session", label: "Sign out", Icon: LogOut },
];

export default function SettingsPage() {
  const { me } = useMe();
  const router = useRouter();
  const toast = useToast();
  const [tab, setTab] = useState<TabKey>("profile");

  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);

  // Editable local copy, seeded once `me` arrives.
  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [settings, setSettings] = useState<Settings>({
    weeklySummary: true,
    shutdownRitualHour: 18,
    notificationBundleMinutes: 30,
  });

  useEffect(() => {
    if (!me) return;
    setName(me.name ?? "");
    setTimezone(me.timezone ?? "UTC");
    setSettings({
      weeklySummary: me.settings.weeklySummary,
      shutdownRitualHour: me.settings.shutdownRitualHour,
      notificationBundleMinutes: me.settings.notificationBundleMinutes,
    });
  }, [me]);

  const dirty =
    !!me &&
    (name !== me.name ||
      timezone !== me.timezone ||
      settings.weeklySummary !== me.settings.weeklySummary ||
      settings.shutdownRitualHour !== me.settings.shutdownRitualHour ||
      settings.notificationBundleMinutes !== me.settings.notificationBundleMinutes);

  async function save() {
    if (!name.trim()) {
      toast("Name can't be empty", "error");
      return;
    }
    setSaving(true);
    try {
      await api.updateProfile({ name: name.trim(), timezone, settings });
      toast("Profile saved", "success");
    } catch {
      toast("Couldn't save your changes", "error");
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    await api.logout();
    toast("Signed out", "info");
    router.replace("/");
  }

  async function resendVerification() {
    setSending(true);
    try {
      const r = await api.resendVerification();
      toast(r.alreadyVerified ? "Your email is already verified" : "Verification email sent", "success");
    } catch {
      toast("Could not send verification email", "error");
    } finally {
      setSending(false);
    }
  }

  const verified = me?.emailVerified ?? false;
  const tzOptions = Array.from(new Set([timezone, ...COMMON_TZS]));

  const initials =
    (name || me?.name || me?.email || "U")
      .split(/\s+/)
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

  return (
    <div className="mx-auto max-w-4xl pb-24 animate-rise">
      <h1 className="font-display text-2xl font-bold">Settings</h1>
      <p className="mt-1 text-sm text-muted">Manage your account and preferences</p>

      <div className="mt-8 grid gap-6 md:grid-cols-[200px_1fr]">
        {/* Left tab nav */}
        <nav className="flex gap-1.5 overflow-x-auto md:flex-col md:gap-1">
          {TABS.map(({ key, label, Icon }) => {
            const on = tab === key;
            const danger = key === "session";
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  on
                    ? danger
                      ? "bg-[rgb(var(--urgent)/0.12)] text-urgent"
                      : "bg-[rgb(var(--active-bg))] text-[rgb(var(--active-fg))]"
                    : "text-muted hover:bg-surface-2 hover:text-ink"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            );
          })}
        </nav>

        {/* Right panel */}
        <div className="card p-6">
          {tab === "profile" && (
            <div>
              <h2 className="font-display text-base font-semibold">Profile Information</h2>
              <div className="mt-5 flex items-center gap-4">
                <span className="grid h-14 w-14 place-items-center rounded-full bg-accent-soft text-base font-semibold text-accent">
                  {initials}
                </span>
                <span className="text-xs text-faint">Your initials are used as your avatar.</span>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Field label="Full Name">
                  <input
                    className="input"
                    value={name}
                    maxLength={120}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                  />
                </Field>
                <Field label="Email">
                  <input className="input opacity-60" value={me?.email ?? ""} disabled readOnly />
                </Field>
                <Field label="Timezone">
                  <select className="input" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                    {tzOptions.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <p className="mt-3 text-xs text-faint">All times are stored in UTC and rendered in your zone.</p>
            </div>
          )}

          {tab === "reports" && (
            <div>
              <h2 className="font-display text-base font-semibold">Rituals &amp; reports</h2>
              <div className="mt-5 space-y-5">
                <div className="flex items-center justify-between gap-4 rounded-xl border border-line bg-bg p-4">
                  <div>
                    <p className="text-sm font-medium">Weekly summary</p>
                    <p className="text-xs text-ink-300">A Monday digest with your Cost-of-Context stat.</p>
                  </div>
                  <Switch
                    checked={settings.weeklySummary}
                    onCheckedChange={(v) => setSettings((s) => ({ ...s, weeklySummary: v }))}
                    label="Weekly summary"
                  />
                </div>
                <Field label="Shutdown ritual hour">
                  <select
                    className="input"
                    value={settings.shutdownRitualHour}
                    onChange={(e) => setSettings((s) => ({ ...s, shutdownRitualHour: Number(e.target.value) }))}
                  >
                    {Array.from({ length: 24 }, (_, h) => (
                      <option key={h} value={h}>
                        {String(h).padStart(2, "0")}:00
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-faint">When the daily wrap-up fires.</p>
                </Field>
                <Field label="Notification bundling">
                  <select
                    className="input"
                    value={settings.notificationBundleMinutes}
                    onChange={(e) => setSettings((s) => ({ ...s, notificationBundleMinutes: Number(e.target.value) }))}
                  >
                    {[0, 15, 30, 60, 120].map((m) => (
                      <option key={m} value={m}>
                        {m === 0 ? "Off (notify immediately)" : `Every ${m} min`}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-faint">Low-priority alerts are batched on this cadence.</p>
                </Field>
              </div>
            </div>
          )}

          {tab === "verification" && (
            <div>
              <h2 className="font-display text-base font-semibold">Account verification</h2>
              <div className="mt-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${
                      verified ? "bg-fyi/15 text-fyi" : "bg-reply/15 text-reply"
                    }`}
                  >
                    {verified ? <BadgeCheck className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{verified ? "Email verified" : "Email not verified"}</p>
                    <p className="text-xs text-ink-300">
                      {verified
                        ? "Your account is verified and fully secured."
                        : "Verify your email to secure your account and enable all features."}
                    </p>
                  </div>
                </div>
                {!verified && (
                  <button className="btn-ghost shrink-0" onClick={resendVerification} disabled={sending}>
                    {sending ? "Sending…" : "Verify now"}
                  </button>
                )}
              </div>
            </div>
          )}

          {tab === "data" && (
            <div>
              <h2 className="font-display text-base font-semibold">Connections &amp; data</h2>
              <p className="mt-2 text-sm text-ink-300">
                Manage which services are connected. Disconnecting revokes the OAuth token and purges every cached
                entity for that provider — emails, events, messages, all of it.
              </p>
              <Link href="/connections" className="btn-ghost mt-4">
                Manage connections →
              </Link>
            </div>
          )}

          {tab === "webhooks" && <WebhooksPanel />}

          {tab === "session" && (
            <div>
              <h2 className="font-display text-base font-semibold text-urgent">Session</h2>
              <p className="mt-2 text-sm text-ink-300">Sign out of Momentum on this device.</p>
              <button className="btn-danger mt-4" onClick={logout}>
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sticky save bar — only appears when something changed */}
      {dirty && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/90 backdrop-blur-md">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3">
            <p className="text-sm text-muted">You have unsaved changes.</p>
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg transition-transform hover:scale-[1.02] disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-ink-400">{label}</span>
      {children}
    </label>
  );
}

function WebhooksPanel() {
  const { data, loading, error } = useAsync(() => api.webhookStatus());
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const fullUrl = data ? `${origin}${data.endpoint}` : "";

  const PROVIDER_COLOR: Record<string, string> = {
    gmail: "var(--pop-amber)",
    googlecalendar: "var(--pop-cyan)",
    slack: "var(--pop-pink)",
    github: "var(--hover)",
  };

  return (
    <div>
      <h2 className="font-display text-base font-semibold">Webhooks</h2>
      <p className="mt-1 text-sm text-muted">
        Realtime events (new mail, calendar, Slack, GitHub) are pushed to this endpoint instead of polling.
      </p>

      <div className="mt-5 flex items-center gap-2">
        <span
          className={`chip ${data?.configured ? "bg-fyi/15 text-fyi" : "bg-reply/15 text-reply"}`}
        >
          {loading ? "checking…" : data?.configured ? "Signing configured" : "Signing secret not set"}
        </span>
      </div>

      <label className="mt-4 block text-xs font-medium text-ink-400">Receiver endpoint</label>
      <div className="mt-1 flex items-center gap-2">
        <input className="input font-mono text-xs" value={fullUrl} readOnly />
        <button
          type="button"
          className="btn-ghost shrink-0 !px-3"
          onClick={() => fullUrl && navigator.clipboard?.writeText(fullUrl)}
          aria-label="Copy endpoint"
        >
          <Copy className="h-4 w-4" />
        </button>
      </div>

      <h3 className="mt-6 text-sm font-semibold">Recent deliveries</h3>
      {error ? (
        <p className="mt-2 text-sm text-urgent">Couldn&apos;t load deliveries — {error}</p>
      ) : loading ? (
        <div className="mt-2 space-y-2">
          {[0, 1, 2].map((i) => (
            <span key={i} className="block h-12 animate-pulse rounded-xl bg-surface-2" />
          ))}
        </div>
      ) : data && data.recent.length > 0 ? (
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {data.recent.map((d) => {
            const color = PROVIDER_COLOR[d.provider] ?? "var(--accent)";
            return (
              <div
                key={d.id}
                className="rounded-xl border border-line border-l-4 bg-bg p-3"
                style={{ borderLeftColor: `rgb(${color})` }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium capitalize">{d.provider}</span>
                  <span className="font-mono text-[11px] text-faint">
                    {new Date(d.receivedAt).toLocaleString()}
                  </span>
                </div>
                <p className="mt-0.5 truncate font-mono text-[11px] text-muted">{d.id}</p>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-2 text-sm text-muted">No deliveries yet. They appear here as events arrive.</p>
      )}
    </div>
  );
}
