"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, ShieldAlert, Save } from "lucide-react";
import { api } from "@/lib/api";
import { useMe } from "@/lib/hooks";
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

export default function SettingsPage() {
  const { me } = useMe();
  const router = useRouter();
  const toast = useToast();

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
    router.replace("/login");
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

  return (
    <div className="mx-auto max-w-2xl pb-24">
      <h1 className="font-display text-2xl font-bold">Settings</h1>

      {/* Editable profile */}
      <section className="card mt-6 p-5">
        <h2 className="font-display text-sm font-semibold text-accent">Profile</h2>

        <div className="mt-4 space-y-4">
          <Field label="Name">
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
            <p className="mt-1 text-xs text-faint">Email is tied to your login and can&apos;t be changed here.</p>
          </Field>

          <Field label="Timezone">
            <select className="input" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
              {tzOptions.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-faint">All times are stored in UTC and rendered in your zone.</p>
          </Field>
        </div>
      </section>

      {/* Editable rituals & reports */}
      <section className="card mt-5 p-5">
        <h2 className="font-display text-sm font-semibold text-accent">Rituals &amp; reports</h2>

        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between gap-4">
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
            <p className="mt-1 text-xs text-faint">When the daily wrap-up (finished, rolled over, drafts) fires.</p>
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
      </section>

      {/* Account verification (unchanged) */}
      <section className="card mt-5 p-5">
        <h2 className="font-display text-sm font-semibold text-accent">Account verification</h2>
        <div className="mt-3 flex items-center justify-between gap-4">
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
      </section>

      <section className="card mt-5 p-5">
        <h2 className="font-display text-sm font-semibold text-accent">Connections &amp; data</h2>
        <p className="mt-2 text-sm text-ink-300">
          Manage which services are connected. Disconnecting revokes the OAuth token and purges every cached entity for
          that provider — emails, events, messages, all of it.
        </p>
        <Link href="/connections" className="btn-ghost mt-3">
          Manage connections →
        </Link>
      </section>

      <section className="card mt-5 border-urgent/30 p-5">
        <h2 className="font-display text-sm font-semibold text-urgent">Session</h2>
        <button className="btn-danger mt-3" onClick={logout}>
          Sign out
        </button>
      </section>

      {/* Sticky save bar — only appears when something changed */}
      {dirty && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/90 backdrop-blur-md">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-4 px-4 py-3">
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
