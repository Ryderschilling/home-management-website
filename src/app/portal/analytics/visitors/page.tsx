"use client";

import { useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type RangeKey = "7D" | "30D" | "90D" | "12M";

type DayPoint = {
  day: string;
  uniqueVisitors: number;
  pageviews: number;
};

type PageRow = {
  page: string;
  uniqueVisitors: number;
  pageviews: number;
};

type FunnelStep = {
  label: string;
  count: number;
  pct: number;
};

type ReferrerRow = {
  source: string;
  visitors: number;
};

type Kpis = {
  uniqueVisitors: number;
  totalPageviews: number;
  visitorsToday: number;
  avgDailyPageviews: number;
};

type VisitorData = {
  configured: boolean;
  range?: string;
  resetAt?: string | null;
  kpis?: Kpis;
  daily?: DayPoint[];
  topPages?: PageRow[];
  funnel?: FunnelStep[];
  referrers?: ReferrerRow[];
};

// ─── Style constants (matching CHM portal design tokens) ──────────────────────

const S = {
  card: "rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-[var(--portal-card-pad)]",
  label: "text-[9px] font-medium uppercase tracking-[0.28em] text-[var(--text-muted)]",
  kpiValue: "text-3xl font-semibold tracking-tight text-[var(--text-primary)]",
  kpiSub: "mt-0.5 text-xs text-[var(--text-secondary)]",
  rangeBtn: (active: boolean) =>
    `inline-flex items-center justify-center rounded-lg border px-3 py-1.5 text-xs font-medium uppercase tracking-[0.18em] transition ${
      active
        ? "border-[var(--accent-warm)] bg-[rgba(201,184,154,0.1)] text-[var(--accent-warm)]"
        : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-hover)] hover:text-[var(--text-primary)]"
    }`,
};

const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: "7D", label: "7D" },
  { key: "30D", label: "30D" },
  { key: "90D", label: "90D" },
  { key: "12M", label: "12M" },
];

// ─── Utility ─────────────────────────────────────────────────────────────────

function integer(n: number) {
  return new Intl.NumberFormat("en-US").format(n);
}

function fmtDay(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmtPage(path: string) {
  if (path === "/" || path === "") return "/ (Homepage)";
  return path.length > 38 ? path.slice(0, 36) + "…" : path;
}

function fmtDateTime(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString();
}

// ─── Bar chart (SVG, no library) ─────────────────────────────────────────────

function BarChart({ data, metric }: { data: DayPoint[]; metric: "uniqueVisitors" | "pageviews" }) {
  const max = Math.max(...data.map((d) => d[metric]), 1);
  const H = 120; // bar area height in px
  const labelEvery = data.length > 14 ? Math.ceil(data.length / 7) : 1;

  return (
    <div className="w-full overflow-hidden">
      <div
        className="flex items-end gap-[2px]"
        style={{ height: `${H}px` }}
      >
        {data.map((d, i) => {
          const h = Math.max(2, Math.round((d[metric] / max) * H));
          const isToday = d.day === new Date().toISOString().slice(0, 10);
          return (
            <div
              key={d.day}
              className="group relative flex flex-1 flex-col items-center justify-end"
              style={{ height: `${H}px` }}
            >
              {/* Tooltip */}
              <div className="pointer-events-none absolute bottom-[calc(100%+4px)] left-1/2 z-10 -translate-x-1/2 scale-90 opacity-0 transition-all duration-150 group-hover:scale-100 group-hover:opacity-100">
                <div className="whitespace-nowrap rounded-lg border border-[var(--border)] bg-[var(--surface-3)] px-2.5 py-1.5 text-[11px] text-[var(--text-primary)] shadow-xl">
                  <div className="font-medium">{fmtDay(d.day)}</div>
                  <div className="mt-0.5 text-[var(--text-secondary)]">
                    {metric === "uniqueVisitors"
                      ? `${integer(d.uniqueVisitors)} visitors`
                      : `${integer(d.pageviews)} pageviews`}
                  </div>
                </div>
              </div>
              {/* Bar */}
              <div
                className={`w-full rounded-t-sm transition-all duration-300 ${
                  isToday
                    ? "bg-[var(--accent-warm)]"
                    : "bg-[rgba(201,184,154,0.35)] group-hover:bg-[rgba(201,184,154,0.6)]"
                }`}
                style={{ height: `${h}px` }}
              />
            </div>
          );
        })}
      </div>
      {/* X-axis labels */}
      <div className="mt-2 flex gap-[2px]">
        {data.map((d, i) => (
          <div key={d.day} className="flex-1 text-center text-[9px] text-[var(--text-muted)]">
            {i % labelEvery === 0 ? fmtDay(d.day).split(" ")[1] : ""}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Funnel (animated widths) ─────────────────────────────────────────────────

function FunnelChart({ steps }: { steps: FunnelStep[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setTimeout(() => setMounted(true), 80); }, []);

  const colors = [
    "rgba(201,184,154,0.9)",
    "rgba(201,184,154,0.7)",
    "rgba(201,184,154,0.45)",
    "rgba(201,184,154,0.25)",
  ];

  return (
    <div className="flex flex-col gap-3">
      {steps.map((step, i) => {
        const prev = i > 0 ? steps[i - 1] : null;
        const dropOff = prev && prev.count > 0 ? 100 - step.pct : null;

        return (
          <div key={step.label}>
            <div className="mb-1.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-semibold"
                  style={{ background: colors[i], color: "#0e0e0f" }}
                >
                  {i + 1}
                </span>
                <span className="text-sm text-[var(--text-primary)]">{step.label}</span>
              </div>
              <div className="flex items-center gap-3">
                {dropOff !== null && dropOff > 0 && (
                  <span className="text-[11px] text-red-400/70">−{dropOff}%</span>
                )}
                <span className="text-sm font-medium tabular-nums text-[var(--accent-warm)]">
                  {step.pct}%
                </span>
                <span className="w-12 text-right text-xs text-[var(--text-secondary)]">
                  {integer(step.count)}
                </span>
              </div>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--surface-3)]">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: mounted ? `${Math.max(step.pct, step.count > 0 ? 1 : 0)}%` : "0%",
                  background: colors[i],
                  transitionDelay: `${i * 120}ms`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Top pages table ──────────────────────────────────────────────────────────

function TopPages({ pages }: { pages: PageRow[] }) {
  const max = Math.max(...pages.map((p) => p.uniqueVisitors), 1);
  return (
    <div className="flex flex-col divide-y divide-[var(--border)]">
      {pages.map((p) => (
        <div key={p.page} className="flex items-center gap-3 py-2.5">
          <div className="flex-1 min-w-0">
            <div className="truncate text-sm text-[var(--text-primary)]">{fmtPage(p.page)}</div>
            <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-[var(--surface-3)]">
              <div
                className="h-full rounded-full bg-[rgba(201,184,154,0.4)]"
                style={{ width: `${(p.uniqueVisitors / max) * 100}%` }}
              />
            </div>
          </div>
          <div className="flex flex-shrink-0 flex-col items-end">
            <span className="text-sm font-medium tabular-nums text-[var(--text-primary)]">
              {integer(p.uniqueVisitors)}
            </span>
            <span className="text-[10px] text-[var(--text-muted)]">
              {integer(p.pageviews)} views
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Referrers ────────────────────────────────────────────────────────────────

function Referrers({ referrers }: { referrers: ReferrerRow[] }) {
  const max = Math.max(...referrers.map((r) => r.visitors), 1);
  const total = referrers.reduce((s, r) => s + r.visitors, 0);
  return (
    <div className="flex flex-col divide-y divide-[var(--border)]">
      {referrers.map((r) => (
        <div key={r.source} className="flex items-center gap-3 py-2.5">
          <div className="flex-1 min-w-0">
            <div className="truncate text-sm text-[var(--text-primary)]">{r.source}</div>
            <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-[var(--surface-3)]">
              <div
                className="h-full rounded-full bg-[rgba(201,184,154,0.4)]"
                style={{ width: `${(r.visitors / max) * 100}%` }}
              />
            </div>
          </div>
          <div className="flex flex-shrink-0 flex-col items-end">
            <span className="text-sm font-medium tabular-nums text-[var(--text-primary)]">
              {integer(r.visitors)}
            </span>
            <span className="text-[10px] text-[var(--text-muted)]">
              {total > 0 ? `${Math.round((r.visitors / total) * 100)}%` : "—"}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Device exclusion toggle ──────────────────────────────────────────────────

function DeviceExclusionToggle() {
  const [excluded, setExcluded] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Check current opt-out state from localStorage (PostHog stores it here)
    try {
      const val = localStorage.getItem("ph_optout");
      setExcluded(val === "1");
    } catch {}
  }, []);

  async function toggle() {
    setBusy(true);
    try {
      if (typeof window !== "undefined" && (window as unknown as { posthog?: { opt_out_capturing: () => void; opt_in_capturing: () => void; has_opted_out_capturing: () => boolean } }).posthog) {
        const ph = (window as unknown as { posthog: { opt_out_capturing: () => void; opt_in_capturing: () => void; has_opted_out_capturing: () => boolean } }).posthog;
        if (excluded) {
          ph.opt_in_capturing();
        } else {
          ph.opt_out_capturing();
        }
        setExcluded(!excluded);
      } else {
        // Fallback: write directly to localStorage flag we check above
        const next = !excluded;
        localStorage.setItem("ph_optout", next ? "1" : "0");
        setExcluded(next);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="text-sm font-medium text-[var(--text-primary)]">
          {excluded ? "This device is excluded from tracking" : "This device is being tracked"}
        </div>
        <div className="mt-0.5 text-xs text-[var(--text-secondary)]">
          {excluded
            ? "Your visits and clicks won't show in analytics. Turn on to include yourself."
            : "Turn this off so your own testing doesn't inflate your visitor numbers."}
        </div>
      </div>
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
          excluded
            ? "border-[var(--accent-warm)] bg-[var(--accent-warm)]"
            : "border-[var(--border)] bg-[var(--surface-3)]"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 translate-y-[-0.5px] rounded-full shadow ring-0 transition-transform duration-200 ${
            excluded
              ? "translate-x-5 bg-[#0e0e0f]"
              : "translate-x-0.5 bg-[var(--text-secondary)]"
          }`}
        />
      </button>
    </div>
  );
}

// ─── Not configured state ─────────────────────────────────────────────────────

function NotConfigured() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[var(--text-muted)]">
          <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">Visitor analytics not connected</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--text-secondary)]">
        Connect PostHog to start tracking who visits your site, what they click, and where they drop off.
      </p>
      <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-5 text-left text-sm">
        <p className="font-medium text-[var(--text-primary)]">Setup (5 minutes)</p>
        <ol className="mt-3 space-y-2 text-[var(--text-secondary)]">
          <li>1. Create a free account at <span className="text-[var(--accent-warm)]">app.posthog.com</span></li>
          <li>2. Create a new project → copy your <strong className="text-[var(--text-primary)]">Project API Key</strong></li>
          <li>3. Go to Settings → Personal API Keys → create one</li>
          <li>4. Copy your <strong className="text-[var(--text-primary)]">Project ID</strong> from the URL bar</li>
          <li>5. Add these to Vercel env vars (and your .env.local):</li>
        </ol>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-[var(--surface-3)] p-3 text-xs text-[var(--accent)]">
{`NEXT_PUBLIC_POSTHOG_KEY=phc_XXXXX
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
POSTHOG_PROJECT_ID=12345
POSTHOG_PERSONAL_API_KEY=phx_XXXXX`}
        </pre>
        <p className="mt-3 text-[var(--text-muted)] text-xs">Then run: <code className="text-[var(--accent)]">npm install posthog-js</code></p>
      </div>
    </div>
  );
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-[var(--surface-2)] ${className ?? ""}`}
    />
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function VisitorAnalyticsPage() {
  const [range, setRange] = useState<RangeKey>("30D");
  const [data, setData] = useState<VisitorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metric, setMetric] = useState<"uniqueVisitors" | "pageviews">("uniqueVisitors");
  const [resetting, setResetting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/admin/analytics/visitors?range=${range}`, {
      headers: { "x-admin-token": "1" }, // admin auth (same pattern as rest of app)
    })
      .then((r) => r.json())
      .then((res) => {
        if (cancelled) return;
        if (!res.ok) throw new Error(res.error?.message ?? "Failed to load");
        setData(res.data);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load visitor data");
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [range]);

  async function resetVisitorAnalytics() {
    const confirmed = window.confirm(
      "Reset visitor analytics to zero from right now? Old PostHog history will stay in PostHog, but this dashboard will start fresh."
    );
    if (!confirmed) return;

    setResetting(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch("/api/admin/analytics/visitors", {
        method: "POST",
        headers: { "x-admin-token": "1" },
      });
      const json = await response.json();
      if (!response.ok || !json.ok) {
        throw new Error(json?.error?.message ?? "Failed to reset visitor analytics");
      }

      setNotice(`Visitor analytics reset. This dashboard is now counting fresh from ${fmtDateTime(json.data?.resetAt)}.`);
      setLoading(true);
      const refreshed = await fetch(`/api/admin/analytics/visitors?range=${range}`, {
        headers: { "x-admin-token": "1" },
      });
      const refreshedJson = await refreshed.json();
      if (!refreshed.ok || !refreshedJson.ok) {
        throw new Error(refreshedJson?.error?.message ?? "Failed to reload visitor analytics");
      }
      setData(refreshedJson.data);
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : "Failed to reset visitor analytics");
    } finally {
      setResetting(false);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)] p-[var(--portal-shell-x)] pt-[var(--portal-shell-y)]">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">Visitor Analytics</h1>
          <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
            Who's visiting, what they view, and where you're losing them
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={resetVisitorAnalytics}
            disabled={resetting}
            className="inline-flex items-center justify-center rounded-lg border border-red-900/40 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-red-400 transition hover:bg-red-900/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {resetting ? "Resetting..." : "Reset to Zero"}
          </button>
          {RANGE_OPTIONS.map((o) => (
            <button key={o.key} className={S.rangeBtn(range === o.key)} onClick={() => setRange(o.key)}>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {notice && (
        <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-300">
          {notice}
        </div>
      )}

      {/* Not configured */}
      {!loading && data && !data.configured && <NotConfigured />}

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Content */}
      {(loading || (data && data.configured)) && (
        <div className="space-y-5">
          {/* KPI row */}
          {!loading && data?.resetAt ? (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--text-secondary)]">
              Visitor analytics baseline was reset on {fmtDateTime(data.resetAt)}. All numbers on this page are counted from that reset point forward within the selected range.
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={S.card}>
                  <Skeleton className="mb-2 h-3 w-20" />
                  <Skeleton className="h-8 w-24" />
                </div>
              ))
            ) : (
              <>
                <div className={S.card}>
                  <div className={S.label}>Unique Visitors</div>
                  <div className={S.kpiValue}>{integer(data?.kpis?.uniqueVisitors ?? 0)}</div>
                  <div className={S.kpiSub}>in the last {range}</div>
                </div>
                <div className={S.card}>
                  <div className={S.label}>Total Pageviews</div>
                  <div className={S.kpiValue}>{integer(data?.kpis?.totalPageviews ?? 0)}</div>
                  <div className={S.kpiSub}>in the last {range}</div>
                </div>
                <div className={S.card}>
                  <div className={S.label}>Visitors Today</div>
                  <div className={S.kpiValue}>{integer(data?.kpis?.visitorsToday ?? 0)}</div>
                  <div className={S.kpiSub}>so far today</div>
                </div>
                <div className={S.card}>
                  <div className={S.label}>Avg / Day</div>
                  <div className={S.kpiValue}>{integer(data?.kpis?.avgDailyPageviews ?? 0)}</div>
                  <div className={S.kpiSub}>pageviews per day</div>
                </div>
              </>
            )}
          </div>

          {/* Bar chart */}
          <div className={S.card}>
            <div className="mb-4 flex items-center justify-between">
              <div className={S.label}>Visitors Over Time</div>
              <div className="flex items-center gap-1">
                {(["uniqueVisitors", "pageviews"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMetric(m)}
                    className={`rounded px-2 py-1 text-[10px] font-medium uppercase tracking-wider transition ${
                      metric === m
                        ? "bg-[rgba(201,184,154,0.15)] text-[var(--accent-warm)]"
                        : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                    }`}
                  >
                    {m === "uniqueVisitors" ? "Visitors" : "Pageviews"}
                  </button>
                ))}
              </div>
            </div>
            {loading ? (
              <Skeleton className="h-[140px] w-full" />
            ) : (data?.daily && data.daily.length > 0) ? (
              <BarChart data={data.daily} metric={metric} />
            ) : (
              <div className="flex h-[120px] items-center justify-center text-sm text-[var(--text-muted)]">
                No visit data yet
              </div>
            )}
          </div>

          {/* Funnel + Referrers */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* Conversion funnel */}
            <div className={S.card}>
              <div className="mb-1 flex items-center justify-between">
                <div className={S.label}>Conversion Funnel</div>
                <span className="text-[10px] text-[var(--text-muted)]">where visitors drop off</span>
              </div>
              <p className="mb-4 text-xs text-[var(--text-secondary)]">
                From first visit to submitting a lead — see where you're losing people.
              </p>
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : data?.funnel ? (
                <FunnelChart steps={data.funnel} />
              ) : null}
            </div>

            {/* Traffic sources */}
            <div className={S.card}>
              <div className="mb-1">
                <div className={S.label}>Traffic Sources</div>
              </div>
              <p className="mb-4 text-xs text-[var(--text-secondary)]">
                Where your visitors are coming from. Focus your energy on what's already working.
              </p>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : data?.referrers && data.referrers.length > 0 ? (
                <Referrers referrers={data.referrers} />
              ) : (
                <div className="flex h-[120px] items-center justify-center text-sm text-[var(--text-muted)]">
                  No referrer data yet
                </div>
              )}
            </div>
          </div>

          {/* Top pages */}
          <div className={S.card}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className={S.label}>Top Pages</div>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  Your most-visited pages. High traffic + low leads = a page that needs a better CTA.
                </p>
              </div>
            </div>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : data?.topPages && data.topPages.length > 0 ? (
              <TopPages pages={data.topPages} />
            ) : (
              <div className="flex h-[120px] items-center justify-center text-sm text-[var(--text-muted)]">
                No page data yet
              </div>
            )}
          </div>

          {/* Exclude device */}
          <div className={S.card}>
            <div className="mb-3">
              <div className={S.label}>This Device</div>
            </div>
            <DeviceExclusionToggle />
          </div>
        </div>
      )}
    </div>
  );
}
