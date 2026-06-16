"use client";

import Link from "next/link";
import { ChevronDown, HelpCircle, ExternalLink } from "lucide-react";
import { CONNECT_STEPS } from "@/lib/connect-steps";

export function ConnectHelp({ collapsed }: { collapsed?: boolean }) {
  if (collapsed) {
    return (
      <Link
        href="/connections"
        title="How to connect tools"
        className="flex justify-center rounded-lg px-0 py-2.5 text-muted transition-colors hover:bg-surface-2 hover:text-ink"
      >
        <HelpCircle className="h-4 w-4" />
      </Link>
    );
  }
  return (
    <details className="group rounded-lg border border-line bg-surface-2/60">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-sm font-medium text-muted hover:text-ink">
        <HelpCircle className="h-4 w-4 shrink-0" />
        How to connect tools
        <ChevronDown className="ml-auto h-4 w-4 transition-transform group-open:rotate-180" />
      </summary>
      <div className="max-h-64 space-y-3 overflow-y-auto px-3 pb-3">
        {CONNECT_STEPS.map((t) => (
          <div key={t.provider}>
            <p className="text-xs font-semibold text-ink">{t.name}</p>
            <ol className="mt-1 list-decimal space-y-0.5 pl-4 text-[11px] leading-relaxed text-muted">
              {t.steps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
            <a
              href={t.docs}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-[11px] text-accent hover:underline"
            >
              Open setup <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        ))}
      </div>
    </details>
  );
}
