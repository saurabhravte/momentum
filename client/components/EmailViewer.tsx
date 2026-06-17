"use client";

import { useEffect, useMemo, useState } from "react";
import DOMPurify from "dompurify";

/** Bumps a counter whenever the <html> class list changes (theme toggle). */
function useThemeTick() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const obs = new MutationObserver(() => setTick((t) => t + 1));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return tick;
}

/** Read an app CSS variable (an "R G B" triple) as a usable rgb() string. */
function cssVar(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return raw ? `rgb(${raw})` : fallback;
}

/**
 * Defense in depth for untrusted email HTML:
 *  1. DOMPurify strips scripts/handlers/forms.
 *  2. Rendered in an <iframe sandbox> with no scripts and no same-origin access.
 *  3. Remote images (tracking pixels!) blocked by default, opt-in per email.
 * The iframe styling is now derived from the app theme so the body is readable
 * in light mode (was hardcoded dark, which looked blank/broken on white).
 */
export function EmailViewer({ html, text }: { html: string | null; text: string }) {
  const [loadImages, setLoadImages] = useState(false);
  const tick = useThemeTick();

  const { doc, blockedImages } = useMemo(() => {
    // theme-derived palette (recomputed on theme change via `tick`)
    const bg = cssVar("--surface", "rgb(255 255 255)");
    const fg = cssVar("--ink", "rgb(17 17 17)");
    const muted = cssVar("--muted", "rgb(110 110 120)");
    const line = cssVar("--line", "rgb(225 225 230)");
    const link = cssVar("--hover", "rgb(6 182 212)");
    void tick;

    if (!html) return { doc: null, blockedImages: 0 };
    let blocked = 0;
    const clean = DOMPurify.sanitize(html, {
      FORBID_TAGS: ["script", "iframe", "object", "embed", "form", "input", "button", "base", "link", "meta"],
      FORBID_ATTR: ["onerror", "onload", "onclick", "srcset"],
    });
    const container = document.createElement("div");
    container.innerHTML = clean;
    container.querySelectorAll("img").forEach((img) => {
      const src = img.getAttribute("src") ?? "";
      const remote = /^https?:/i.test(src) || src.startsWith("//");
      if (remote && !loadImages) {
        blocked++;
        img.setAttribute("data-blocked-src", src);
        img.removeAttribute("src");
        img.style.cssText = `background:${line};border:1px dashed ${muted};min-height:24px;min-width:24px;`;
        img.alt = "🖼 image blocked";
      }
    });
    const body = `<!doctype html><html><head><style>
      body{font:14px/1.6 -apple-system,system-ui,sans-serif;color:${fg};background:${bg};margin:0;padding:16px;word-break:break-word}
      a{color:${link}} img{max-width:100%;height:auto} blockquote{border-left:3px solid ${line};margin:8px 0;padding-left:12px;color:${muted}}
      table{max-width:100% !important}
    </style></head><body>${container.innerHTML}</body></html>`;
    return { doc: body, blockedImages: blocked };
  }, [html, loadImages, tick]);

  if (!doc) {
    return (
      <pre className="whitespace-pre-wrap rounded-xl border border-line bg-surface-2 p-4 text-sm leading-relaxed text-ink">
        {text}
      </pre>
    );
  }

  return (
    <div>
      {blockedImages > 0 && !loadImages && (
        <button
          onClick={() => setLoadImages(true)}
          className="mb-2 rounded-lg border border-line px-2.5 py-1 text-xs text-muted hover:border-[rgb(var(--hover)/0.6)] hover:text-[rgb(var(--hover))]"
        >
          🖼 {blockedImages} remote image{blockedImages > 1 ? "s" : ""} blocked (tracking protection) — load
        </button>
      )}
      <iframe
        sandbox=""
        srcDoc={doc}
        className="h-[420px] w-full rounded-xl border border-line bg-surface"
        title="Email content (sandboxed)"
      />
    </div>
  );
}
