"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * First-party ad tracking (added 2026-09-28), feeds the Ads page in CHM Ops.
 *
 * What it does, and nothing more:
 *   - gives each browser an anonymous visitor id (localStorage + cookie)
 *   - remembers the FIRST and the LATEST ad / utm / click id that brought it
 *     here, in the `chm_attr` cookie, so every lead form's server route can
 *     hand it to CHM Ops without each form knowing about tracking
 *   - sends page views, clicks on links and buttons, 50% / 90% scroll and
 *     booking form steps to /api/t, which writes them to the CHM Ops database
 *
 * Only runs on the real domain, never on /portal (logged-in clients), and
 * never on localhost or previews unless the URL has ?chm_debug=1.
 *
 * Accuracy rules (added 2026-10-01):
 *   - a page view only counts once a human shows up: the first tap, scroll or
 *     key press, or 2.5 seconds with the page actually on screen. Link-preview
 *     bots and ad-review crawlers load the page and leave inside a second, so
 *     they never count.
 *   - opening any page with ?chm_internal=1 marks this browser as Ryder's own
 *     and it is never tracked again (?chm_internal=0 undoes it).
 *   - the same click twice within 1.5s (a double tap) counts once.
 */

type Touch = {
  utmSource?: string; utmMedium?: string; utmCampaign?: string; utmContent?: string; utmTerm?: string;
  fbclid?: string; gclid?: string; metaAdId?: string; landingPage?: string; referrer?: string; at?: string;
};
type Attr = { v: string; ft?: Touch; lt?: Touch };
type Ev = { type: string; path: string; label?: string; target?: string };

declare global {
  interface Window {
    chmTrack?: (type: string, data?: { label?: string; target?: string }) => void;
  }
}

const COOKIE = "chm_attr";
const MAX_AGE = 60 * 60 * 24 * 180;

function enabled(): boolean {
  try {
    const q = new URLSearchParams(location.search).get("chm_internal");
    if (q === "1") localStorage.setItem("chm_internal", "1");
    if (q === "0") localStorage.removeItem("chm_internal");
    if (localStorage.getItem("chm_internal") === "1") return false;
  } catch {}
  try {
    const h = location.hostname;
    if (/(^|\.)coastalhomemngt30a\.com$/.test(h)) return true;
    if (new URLSearchParams(location.search).has("chm_debug")) {
      sessionStorage.setItem("chm_debug", "1");
      return true;
    }
    return sessionStorage.getItem("chm_debug") === "1";
  } catch {
    return false;
  }
}

function rid(): string {
  try {
    return crypto.randomUUID().replace(/-/g, "").slice(0, 24);
  } catch {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}

function readAttr(): Attr | null {
  try {
    const m = document.cookie.match(new RegExp(`(?:^|; )${COOKIE}=([^;]*)`));
    if (m) return JSON.parse(decodeURIComponent(m[1])) as Attr;
  } catch {}
  try {
    const s = localStorage.getItem(COOKIE);
    if (s) return JSON.parse(s) as Attr;
  } catch {}
  return null;
}

function writeAttr(a: Attr) {
  const json = JSON.stringify(a);
  try {
    document.cookie = `${COOKIE}=${encodeURIComponent(json)}; path=/; max-age=${MAX_AGE}; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
  } catch {}
  try {
    localStorage.setItem(COOKIE, json);
  } catch {}
}

function cut(v: string | null, n = 200): string | undefined {
  return v ? v.slice(0, n) : undefined;
}

/** What brought this page view here, or null when nothing did (internal nav). */
function touchFromUrl(): Touch | null {
  const p = new URLSearchParams(location.search);
  const ref = document.referrer && !document.referrer.includes(location.hostname) ? document.referrer : "";
  const t: Touch = {
    utmSource: cut(p.get("utm_source"), 80),
    utmMedium: cut(p.get("utm_medium"), 80),
    utmCampaign: cut(p.get("utm_campaign"), 160),
    utmContent: cut(p.get("utm_content"), 160),
    utmTerm: cut(p.get("utm_term"), 160),
    fbclid: cut(p.get("fbclid"), 300),
    gclid: cut(p.get("gclid"), 300),
    metaAdId: cut(p.get("aid") || p.get("ad_id"), 40),
  };
  // Ad links that carry the ad id in utm_content={{ad.id}} instead of ad_id.
  if (!t.metaAdId && /^(meta|facebook|fb|instagram|ig)$/i.test(t.utmSource || "") && /^\d{6,}$/.test(t.utmContent || "")) {
    t.metaAdId = t.utmContent;
  }
  const any = Object.values(t).some(Boolean) || !!ref;
  if (!any) return null;
  return { ...t, referrer: cut(ref, 300), landingPage: cut(location.pathname, 200), at: new Date().toISOString() };
}

function device(): string {
  return /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? "mobile" : "desktop";
}

export default function AdTracker() {
  const pathname = usePathname();
  const queue = useRef<Ev[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const on = useRef(false);
  const scrolled = useRef<Set<string>>(new Set());
  const human = useRef(false);
  const pending = useRef<string | null>(null);
  const viewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastClick = useRef<{ key: string; at: number } | null>(null);

  // One-time setup: identity, click listener, flush on hide.
  useEffect(() => {
    if (!enabled()) return;
    on.current = true;

    const flush = () => {
      if (!queue.current.length) return;
      const a = readAttr();
      if (!a) return;
      const lt = a.lt ?? a.ft ?? {};
      let sid = "";
      try {
        sid = sessionStorage.getItem("chm_sid") || rid();
        sessionStorage.setItem("chm_sid", sid);
      } catch {}
      const body = JSON.stringify({
        v: a.v,
        s: sid,
        d: device(),
        src: lt.utmSource, camp: lt.utmCampaign, cont: lt.utmContent, aid: lt.metaAdId, ref: lt.referrer,
        e: queue.current.splice(0, 25),
      });
      try {
        if (!navigator.sendBeacon?.("/api/t", new Blob([body], { type: "application/json" }))) {
          fetch("/api/t", { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } }).catch(() => {});
        }
      } catch {}
    };
    const push = (e: Ev) => {
      queue.current.push(e);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, 1500);
    };

    window.chmTrack = (type, data) => push({ type, path: location.pathname, ...data });

    // The page view waiting for proof that a person is here.
    const sendPending = () => {
      if (viewTimer.current) clearTimeout(viewTimer.current);
      viewTimer.current = null;
      const p = pending.current;
      pending.current = null;
      if (p) push({ type: "pageview", path: p });
    };
    const onHuman = () => {
      human.current = true;
      sendPending();
    };
    (window as unknown as { __chmArm?: () => void }).__chmArm = () => {
      if (human.current) return sendPending();
      if (viewTimer.current) clearTimeout(viewTimer.current);
      const wait = () => {
        viewTimer.current = setTimeout(() => {
          if (document.visibilityState === "visible") sendPending();
          else wait();
        }, 2500);
      };
      wait();
    };

    const onClick = (ev: MouseEvent) => {
      const el = (ev.target as Element | null)?.closest?.("a, button, [data-track]") as HTMLElement | null;
      if (!el || location.pathname.startsWith("/portal")) return;
      const label = (el.getAttribute("data-track") || el.getAttribute("aria-label") || el.innerText || "").replace(/\s+/g, " ").trim().slice(0, 80);
      const href = el.getAttribute("href") || (el.getAttribute("type") === "submit" ? "submit" : "");
      const key = `${location.pathname}|${label}|${href}`;
      const now = Date.now();
      if (lastClick.current && lastClick.current.key === key && now - lastClick.current.at < 1500) return;
      lastClick.current = { key, at: now };
      push({ type: "click", path: location.pathname, label: label || undefined, target: href ? href.slice(0, 200) : undefined });
    };
    const onScroll = () => {
      const h = document.documentElement;
      const pctDone = (h.scrollTop + innerHeight) / Math.max(1, h.scrollHeight);
      for (const mark of ["50", "90"]) {
        const key = `${location.pathname}:${mark}`;
        if (pctDone >= Number(mark) / 100 && !scrolled.current.has(key)) {
          scrolled.current.add(key);
          push({ type: "scroll", path: location.pathname, target: mark });
        }
      }
    };
    const onHide = () => {
      if (document.visibilityState === "hidden") flush();
    };

    const HUMAN = ["pointerdown", "touchstart", "keydown", "scroll", "wheel"] as const;
    for (const t of HUMAN) addEventListener(t, onHuman, { passive: true, capture: true });
    document.addEventListener("click", onClick, true);
    addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onHide);
    return () => {
      for (const t of HUMAN) removeEventListener(t, onHuman, { capture: true });
      document.removeEventListener("click", onClick, true);
      removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onHide);
      if (viewTimer.current) clearTimeout(viewTimer.current);
      delete window.chmTrack;
      delete (window as unknown as { __chmArm?: () => void }).__chmArm;
    };
  }, []);

  // Every route change: update attribution, record the page view.
  useEffect(() => {
    if (!on.current && !enabled()) return;
    if (pathname?.startsWith("/portal")) return;
    const now = touchFromUrl();
    let a = readAttr();
    if (!a) a = { v: rid(), ft: now ?? { landingPage: location.pathname, at: new Date().toISOString() } };
    else if (now) {
      if (!a.ft) a.ft = now;
      a.lt = now;
    }
    writeAttr(a);
    // Counted only once a person is confirmed (see the accuracy rules above).
    pending.current = location.pathname;
    (window as unknown as { __chmArm?: () => void }).__chmArm?.();
  }, [pathname]);

  return null;
}
