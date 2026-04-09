"use client";

import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PortalDrawer } from "@/app/portal/_components/PortalDrawer";

type Job = {
  id: string;
  title: string;
  status: string;
  scheduled_for: string;
  completed_at?: string | null;
  notes?: string | null;
  client_name?: string | null;
  property_name?: string | null;
  property_address_line1?: string | null;
  plan_name?: string | null;
  source_type?: string | null;
  photo_count?: number | null;
  photos?: Array<{
    id: string;
    url: string;
    caption?: string | null;
    uploaded_at?: string | null;
  }> | null;
};

type Retainer = {
  id: string;
  service_type?: string | null;
  billing_model?: string | null;
  billing_frequency?: string | null;
  amount_cents?: number | null;
  status: string;
  archived_at?: string | null;
};

type Communication = {
  id: string;
  client_name?: string | null;
  subject?: string | null;
  status?: string | null;
  approved_at?: string | null;
  follow_up_due_at?: string | null;
  type?: string | null;
};

type InvoiceDashboard = {
  summary: {
    outstandingBalanceCents: number;
    overdueBalanceCents: number;
  };
  queue: {
    overdueInvoices: Array<{
      id: string;
      invoice_number: string;
      client_name?: string | null;
      total_cents: number;
      due_date?: string | null;
    }>;
  };
};

type MonthCell = { kind: "blank" } | { kind: "day"; date: Date; key: string };

const PANEL = "rounded-[24px] border border-[var(--border)] bg-[var(--surface)] shadow-[0_22px_60px_rgba(0,0,0,0.24)]";
const PANEL_INNER = "rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]";
const LABEL = "text-[10px] font-medium uppercase tracking-[0.24em] text-[var(--text-muted)]";
const BUTTON_SMALL =
  "inline-flex items-center justify-center rounded-lg border border-[var(--border)] px-3 py-2 text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--text-secondary)] transition hover:border-[var(--border-hover)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]";

function panelPadding(size: "base" | "lg" = "base"): CSSProperties {
  return { padding: size === "lg" ? "var(--portal-card-pad-lg)" : "var(--portal-card-pad)" };
}

function money(cents: number | null | undefined) {
  return `$${((typeof cents === "number" ? cents : 0) / 100).toFixed(2)}`;
}

function fmtDate(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function fmtDayKey(key: string) {
  const d = new Date(`${key}T12:00:00`);
  if (Number.isNaN(d.getTime())) return key;
  return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}

function toLocalDateKey(date: Date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatMonthLabel(year: number, monthIndex: number) {
  return new Date(year, monthIndex, 1).toLocaleDateString([], { month: "long", year: "numeric" });
}

function buildMonthGrid(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const first = new Date(year, month, 1);
  const firstDay = (first.getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0).getDate();
  const cells: MonthCell[] = [];
  for (let i = 0; i < firstDay; i += 1) cells.push({ kind: "blank" });
  for (let day = 1; day <= days; day += 1) {
    const next = new Date(year, month, day);
    cells.push({ kind: "day", date: next, key: toLocalDateKey(next) });
  }
  return cells;
}

function SectionPanel({
  eyebrow,
  action,
  children,
}: {
  eyebrow: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={PANEL}>
      <div
        className="flex items-center justify-between gap-3 border-b border-[var(--border)]"
        style={panelPadding()}
      >
        <div className={LABEL}>{eyebrow}</div>
        {action ? <div className="flex items-center gap-2">{action}</div> : null}
      </div>
      <div style={panelPadding()}>{children}</div>
    </section>
  );
}

export default function PortalDashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [retainers, setRetainers] = useState<Retainer[]>([]);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [invoiceDashboard, setInvoiceDashboard] = useState<InvoiceDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDayKey, setSelectedDayKey] = useState(toLocalDateKey(new Date()));
  const [jobDrawerOpen, setJobDrawerOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedJobDetail, setSelectedJobDetail] = useState<Job | null>(null);
  const [jobDetailLoading, setJobDetailLoading] = useState(false);
  const [jobActionLoading, setJobActionLoading] = useState(false);
  const [jobActionError, setJobActionError] = useState("");
  const [completionNotes, setCompletionNotes] = useState("");

  async function loadJobs() {
    const response = await fetch(
      `/api/admin/jobs?includeCompleted=true&start=${encodeURIComponent(
        new Date(Date.now() - 1000 * 60 * 60 * 24 * 31).toISOString()
      )}&end=${encodeURIComponent(
        new Date(Date.now() + 1000 * 60 * 60 * 24 * 90).toISOString()
      )}`
    );
    const json = await response.json();
    if (!response.ok || !json.ok) {
      throw new Error(json?.error?.message ?? "Failed to load jobs");
    }
    setJobs(json.data ?? []);
  }

  async function loadJobDetail(jobId: string) {
    setJobDetailLoading(true);
    setJobActionError("");
    try {
      const response = await fetch(`/api/admin/jobs/${jobId}`);
      const json = await response.json();
      if (!response.ok || !json.ok) {
        throw new Error(json?.error?.message ?? "Failed to load job details");
      }
      setSelectedJobDetail(json.data ?? null);
      setCompletionNotes(String(json.data?.notes ?? ""));
    } catch (detailError) {
      setJobActionError(
        detailError instanceof Error ? detailError.message : "Failed to load job details"
      );
      setSelectedJobDetail(null);
    } finally {
      setJobDetailLoading(false);
    }
  }

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [jobsRes, retainersRes, communicationsRes, invoiceDashboardRes] = await Promise.all([
        fetch(`/api/admin/jobs?includeCompleted=true&start=${encodeURIComponent(new Date(Date.now() - 1000 * 60 * 60 * 24 * 31).toISOString())}&end=${encodeURIComponent(new Date(Date.now() + 1000 * 60 * 60 * 24 * 90).toISOString())}`),
        fetch("/api/admin/retainers"),
        fetch("/api/admin/communications?includeResolved=true"),
        fetch("/api/admin/invoices/dashboard"),
      ]);
      const [jobsJson, retainersJson, communicationsJson, invoiceDashboardJson] = await Promise.all([
        jobsRes.json(),
        retainersRes.json(),
        communicationsRes.json(),
        invoiceDashboardRes.json(),
      ]);
      if (!jobsRes.ok || !jobsJson.ok) throw new Error(jobsJson?.error?.message ?? "Failed to load jobs");
      if (!retainersRes.ok || !retainersJson.ok) throw new Error(retainersJson?.error?.message ?? "Failed to load plans");
      if (!communicationsRes.ok || !communicationsJson.ok) throw new Error(communicationsJson?.error?.message ?? "Failed to load communications");
      if (!invoiceDashboardRes.ok || !invoiceDashboardJson.ok) throw new Error(invoiceDashboardJson?.error?.message ?? "Failed to load invoice dashboard");
      setJobs(jobsJson.data ?? []);
      setRetainers(retainersJson.data ?? []);
      setCommunications(communicationsJson.data ?? []);
      setInvoiceDashboard(invoiceDashboardJson.data ?? null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function openJobDrawer(jobId: string) {
    setSelectedJobId(jobId);
    setJobDrawerOpen(true);
    await loadJobDetail(jobId);
  }

  function closeJobDrawer() {
    setJobDrawerOpen(false);
    setSelectedJobId(null);
    setSelectedJobDetail(null);
    setJobActionError("");
    setCompletionNotes("");
  }

  async function markJobCompleted() {
    if (!selectedJobId) return;
    const trimmedNotes = completionNotes.trim();
    if (!trimmedNotes) {
      setJobActionError("Completion notes are required before a job can be marked completed.");
      return;
    }

    setJobActionLoading(true);
    setJobActionError("");
    try {
      const response = await fetch(`/api/admin/jobs/${selectedJobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "COMPLETED",
          notes: trimmedNotes,
        }),
      });
      const json = await response.json();
      if (!response.ok || !json.ok) {
        throw new Error(json?.error?.message ?? "Failed to complete job");
      }

      await loadJobs();
      await loadJobDetail(selectedJobId);
    } catch (actionError) {
      setJobActionError(actionError instanceof Error ? actionError.message : "Failed to complete job");
    } finally {
      setJobActionLoading(false);
    }
  }

  const monthGrid = useMemo(() => buildMonthGrid(viewDate), [viewDate]);
  const jobsByDay = useMemo(() => {
    const map = new Map<string, Job[]>();
    for (const job of jobs) {
      const key = toLocalDateKey(new Date(job.scheduled_for));
      const bucket = map.get(key) ?? [];
      bucket.push(job);
      map.set(key, bucket);
    }
    return map;
  }, [jobs]);

  const todayKey = toLocalDateKey(new Date());
  const todayJobs = useMemo(() =>
    (jobsByDay.get(todayKey) ?? []).filter((job) => job.status !== "CANCELED"),
    [jobsByDay, todayKey]);

  const weekBoundary = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d;
  }, []);

  const weekJobs = useMemo(() =>
    jobs.filter((job) => {
      const scheduled = new Date(job.scheduled_for).getTime();
      return scheduled >= Date.now() && scheduled <= weekBoundary.getTime() && job.status !== "CANCELED";
    }),
    [jobs, weekBoundary]);

  const awaitingApproval = useMemo(() =>
    communications.filter((item) => item.status === "DRAFT" && !item.approved_at),
    [communications]);

  const selectedDayJobs = useMemo(() => jobsByDay.get(selectedDayKey) ?? [], [jobsByDay, selectedDayKey]);

  const activePlans = useMemo(() =>
    retainers.filter((plan) => plan.status === "ACTIVE" && !plan.archived_at),
    [retainers]);

  // MRR from active fixed-recurring monthly plans
  const mrrCents = useMemo(() =>
    activePlans
      .filter((p) => p.billing_model === "FIXED_RECURRING" && (p.billing_frequency === "MONTHLY" || !p.billing_frequency))
      .reduce((sum, p) => sum + (p.amount_cents ?? 0), 0),
    [activePlans]);

  const serviceMix = useMemo(() => {
    const counts = new Map<string, number>();
    for (const plan of activePlans) {
      const key = String(plan.service_type ?? "CUSTOM").replaceAll("_", " ");
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [activePlans]);

  // Compact KPI strip — ordered by daily priority: schedule → money → messages
  const kpis = [
    { label: "Today", value: todayJobs.length },
    { label: "Outstanding", value: money(invoiceDashboard?.summary.outstandingBalanceCents), href: "/portal/invoices", accent: true },
    { label: "Messages", value: awaitingApproval.length, href: "/portal/contacts", alert: awaitingApproval.length > 0 },
    { label: "MRR", value: money(mrrCents), accent: true },
    { label: "This week", value: weekJobs.length },
    { label: "Active plans", value: activePlans.length },
  ];

  return (
    <div className="space-y-6">

      {/* Compact KPI bar */}
      <section className={PANEL} style={panelPadding()}>
        {error ? <div className="mb-4 rounded-xl border border-red-900/30 bg-red-900/10 px-4 py-3 text-sm text-red-300">{error}</div> : null}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {kpis.map((kpi) => {
            const inner = (
              <div
                className={PANEL_INNER}
                style={{
                  ...panelPadding(),
                  ...(kpi.accent ? { background: "linear-gradient(180deg, rgba(201,184,154,0.12) 0%, rgba(28,28,31,1) 100%)", borderColor: "rgba(201,184,154,0.18)" } : {}),
                }}
              >
                <div className={LABEL}>{kpi.label}</div>
                <div
                  className="mt-2 font-serif text-[26px] leading-none tracking-[-0.02em]"
                  style={{ color: kpi.accent ? "var(--accent-warm)" : kpi.alert ? "#fca5a5" : "var(--text-primary)" }}
                >
                  {loading ? "—" : kpi.value}
                </div>
              </div>
            );
            return kpi.href ? (
              <Link key={kpi.label} href={kpi.href} className="block no-underline hover:opacity-80 transition">
                {inner}
              </Link>
            ) : (
              <div key={kpi.label}>{inner}</div>
            );
          })}
        </div>
      </section>

      {/* Calendar + Right column */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.75fr)]">

        {/* Calendar */}
        <SectionPanel
          eyebrow="Calendar"
          action={
            <>
              <button onClick={() => setViewDate(new Date())} className={BUTTON_SMALL}>Today</button>
              <button onClick={() => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))} className={BUTTON_SMALL}>‹</button>
              <button onClick={() => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))} className={BUTTON_SMALL}>›</button>
            </>
          }
        >
          <div className="mb-3 text-sm font-medium text-[var(--text-secondary)]">
            {formatMonthLabel(viewDate.getFullYear(), viewDate.getMonth())}
          </div>
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
            <div>
              <div className="grid grid-cols-7 gap-1.5 pb-2">
                {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                  <div key={`${d}-${i}`} className={`${LABEL} text-center`}>{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {monthGrid.map((cell, index) => {
                  if (cell.kind === "blank") return <div key={`blank-${index}`} className="aspect-square rounded-xl bg-transparent" />;
                  const count = (jobsByDay.get(cell.key) ?? []).length;
                  const isSelected = cell.key === selectedDayKey;
                  const isToday = cell.key === todayKey;
                  return (
                    <button
                      key={cell.key}
                      onClick={() => setSelectedDayKey(cell.key)}
                      className={`aspect-square rounded-xl border p-1.5 text-left transition ${
                        isSelected
                          ? "border-transparent bg-[var(--accent)] text-[#0e0e0f]"
                          : isToday
                          ? "border-[rgba(201,184,154,0.35)] bg-[rgba(201,184,154,0.06)] text-[var(--text-primary)]"
                          : "border-[var(--border)] bg-[rgba(255,255,255,0.015)] text-[var(--text-secondary)] hover:border-[var(--border-hover)] hover:bg-[var(--surface-2)]"
                      }`}
                    >
                      <div className="flex h-full flex-col justify-between">
                        <span className="text-xs font-medium">{cell.date.getDate()}</span>
                        {count > 0 && (
                          <span className={`text-[9px] uppercase tracking-[0.12em] ${isSelected ? "text-[rgba(14,14,15,0.65)]" : "text-[var(--text-muted)]"}`}>
                            {count}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected day panel */}
            <div className={PANEL_INNER} style={panelPadding()}>
              <div className={LABEL}>
                {fmtDayKey(selectedDayKey)}
              </div>
              <div className="mt-3 space-y-2">
                {selectedDayJobs.length === 0 ? (
                  <div className="text-sm text-[var(--text-muted)]">No jobs.</div>
                ) : selectedDayJobs.map((job) => (
                  <button
                    key={job.id}
                    type="button"
                    onClick={() => openJobDrawer(job.id)}
                    className="block w-full rounded-xl border border-[var(--border)] px-3 py-3 text-left transition hover:border-[var(--border-hover)] hover:bg-[var(--surface)]"
                  >
                    <div className="text-sm font-medium text-[var(--text-primary)]">{job.title}</div>
                    <div className="mt-0.5 text-xs text-[var(--text-secondary)]">
                      {job.client_name || "No client"}{job.property_name ? ` · ${job.property_name}` : ""}
                    </div>
                    <div className="mt-2 text-[10px] uppercase tracking-[0.15em] text-[var(--text-muted)]">
                      {fmtDate(job.scheduled_for)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </SectionPanel>

        {/* Right column */}
        <div className="space-y-6">

          {/* Today's queue */}
          <SectionPanel eyebrow="Today's jobs" action={<Link href="/portal/jobs" className={BUTTON_SMALL}>All jobs</Link>}>
            <div className="space-y-2">
              {todayJobs.length === 0 ? (
                <div className="text-sm text-[var(--text-muted)]">Nothing scheduled today.</div>
              ) : todayJobs.map((job) => (
                <div key={job.id} className={`${PANEL_INNER} flex items-start justify-between gap-3`} style={panelPadding()}>
                  <div>
                    <div className="text-sm font-medium text-[var(--text-primary)]">{job.title}</div>
                    <div className="mt-0.5 text-xs text-[var(--text-secondary)]">
                      {job.client_name || "No client"}{job.property_name ? ` · ${job.property_name}` : ""}
                    </div>
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.15em] text-[var(--text-muted)]">
                    {job.source_type === "PLAN" ? "Plan" : "One-off"}
                  </div>
                </div>
              ))}
            </div>
          </SectionPanel>

          {/* Draft messages */}
          {awaitingApproval.length > 0 && (
            <SectionPanel eyebrow={`Messages (${awaitingApproval.length})`} action={<Link href="/portal/contacts" className={BUTTON_SMALL}>Review</Link>}>
              <div className="space-y-2">
                {awaitingApproval.slice(0, 4).map((item) => (
                  <div key={item.id} className={`${PANEL_INNER}`} style={panelPadding()}>
                    <div className="text-sm font-medium text-[var(--text-primary)]">{item.subject || item.type || "Draft"}</div>
                    <div className="mt-0.5 text-xs text-[var(--text-secondary)]">{item.client_name || "No client"}</div>
                  </div>
                ))}
              </div>
            </SectionPanel>
          )}

          {/* Billing pressure */}
          <SectionPanel eyebrow="Billing" action={<Link href="/portal/invoices" className={BUTTON_SMALL}>Invoices</Link>}>
            <div className="space-y-2">
              <div className={`${PANEL_INNER} flex items-center justify-between gap-3`} style={panelPadding()}>
                <div>
                  <div className="text-xs text-[var(--text-muted)]">Outstanding</div>
                  <div className="mt-1 font-serif text-[22px] text-[var(--text-primary)]">{money(invoiceDashboard?.summary.outstandingBalanceCents)}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-[var(--text-muted)]">Overdue</div>
                  <div className="mt-1 font-serif text-[22px] text-[#fca5a5]">{money(invoiceDashboard?.summary.overdueBalanceCents)}</div>
                </div>
              </div>
              {(invoiceDashboard?.queue.overdueInvoices ?? []).slice(0, 3).map((inv) => (
                <div key={inv.id} className={`${PANEL_INNER} flex items-center justify-between gap-3`} style={panelPadding()}>
                  <div>
                    <div className="text-xs font-medium text-[var(--text-primary)]">{inv.invoice_number}</div>
                    <div className="mt-0.5 text-xs text-[var(--text-secondary)]">{inv.client_name || "—"}</div>
                  </div>
                  <div className="text-sm font-medium text-[#fca5a5]">{money(inv.total_cents)}</div>
                </div>
              ))}
            </div>
          </SectionPanel>

        </div>
      </div>

      {/* This week + service mix */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(260px,0.6fr)]">

        <SectionPanel eyebrow="This week" action={<Link href="/portal/jobs" className={BUTTON_SMALL}>All jobs</Link>}>
          <div className="space-y-2">
            {weekJobs.length === 0 ? (
              <div className="text-sm text-[var(--text-muted)]">No jobs scheduled this week.</div>
            ) : weekJobs.slice(0, 8).map((job) => (
              <div key={job.id} className={`${PANEL_INNER} flex items-start justify-between gap-3`} style={panelPadding()}>
                <div>
                  <div className="text-sm font-medium text-[var(--text-primary)]">{job.title}</div>
                  <div className="mt-0.5 text-xs text-[var(--text-secondary)]">
                    {job.client_name || "No client"}{job.property_name ? ` · ${job.property_name}` : ""}
                  </div>
                  <div className="mt-0.5 text-xs text-[var(--text-muted)]">{fmtDate(job.scheduled_for)}</div>
                </div>
                <div className="text-[10px] uppercase tracking-[0.15em] text-[var(--text-muted)]">
                  {job.source_type === "PLAN" ? "Plan" : "One-off"}
                </div>
              </div>
            ))}
          </div>
        </SectionPanel>

        <SectionPanel eyebrow="Active plans by type">
          <div className="space-y-2">
            {serviceMix.length === 0 ? (
              <div className="text-sm text-[var(--text-muted)]">No active plans.</div>
            ) : serviceMix.map(([label, count]) => (
              <div key={label} className={`${PANEL_INNER} flex items-center justify-between gap-3`} style={panelPadding()}>
                <div className="text-sm text-[var(--text-primary)]">{label}</div>
                <div className="font-serif text-[22px] text-[var(--text-primary)]">{count}</div>
              </div>
            ))}
          </div>
        </SectionPanel>

      </div>

      <PortalDrawer
        open={jobDrawerOpen}
        onClose={closeJobDrawer}
        title={selectedJobDetail?.title || "Job details"}
        subtitle="View the visit, mark it completed, or jump into the full jobs workspace for deeper edits."
        footer={
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/portal/jobs" className={BUTTON_SMALL}>
              Open jobs workspace
            </Link>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={closeJobDrawer}
                className={BUTTON_SMALL}
              >
                Close
              </button>
              {selectedJobDetail?.status !== "COMPLETED" ? (
                <button
                  type="button"
                  onClick={markJobCompleted}
                  disabled={jobActionLoading || jobDetailLoading}
                  className="inline-flex items-center justify-center rounded-lg bg-[var(--accent)] px-4 py-2 text-[10px] font-medium uppercase tracking-[0.18em] text-[#0e0e0f] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {jobActionLoading ? "Completing..." : "Mark complete"}
                </button>
              ) : null}
            </div>
          </div>
        }
      >
        {jobDetailLoading ? (
          <div className="text-sm text-[var(--text-muted)]">Loading job details...</div>
        ) : selectedJobDetail ? (
          <div className="space-y-6">
            {jobActionError ? (
              <div className="rounded-xl border border-red-900/30 bg-red-900/10 px-4 py-3 text-sm text-red-300">
                {jobActionError}
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className={PANEL_INNER} style={panelPadding()}>
                <div className={LABEL}>Status</div>
                <div className="mt-2 text-sm font-medium text-[var(--text-primary)]">
                  {selectedJobDetail.status.replaceAll("_", " ")}
                </div>
              </div>
              <div className={PANEL_INNER} style={panelPadding()}>
                <div className={LABEL}>Scheduled</div>
                <div className="mt-2 text-sm font-medium text-[var(--text-primary)]">
                  {fmtDate(selectedJobDetail.scheduled_for)}
                </div>
              </div>
              <div className={PANEL_INNER} style={panelPadding()}>
                <div className={LABEL}>Source</div>
                <div className="mt-2 text-sm font-medium text-[var(--text-primary)]">
                  {selectedJobDetail.source_type === "PLAN"
                    ? selectedJobDetail.plan_name || "Plan"
                    : "One-off"}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className={PANEL_INNER} style={panelPadding()}>
                <div className={LABEL}>Client</div>
                <div className="mt-2 text-sm font-medium text-[var(--text-primary)]">
                  {selectedJobDetail.client_name || "No client"}
                </div>
              </div>
              <div className={PANEL_INNER} style={panelPadding()}>
                <div className={LABEL}>Property</div>
                <div className="mt-2 text-sm font-medium text-[var(--text-primary)]">
                  {selectedJobDetail.property_name || "No property"}
                </div>
                {selectedJobDetail.property_address_line1 ? (
                  <div className="mt-1 text-xs text-[var(--text-secondary)]">
                    {selectedJobDetail.property_address_line1}
                  </div>
                ) : null}
              </div>
            </div>

            <div className={PANEL_INNER} style={panelPadding()}>
              <div className={LABEL}>
                {selectedJobDetail.status === "COMPLETED" ? "Job notes" : "Completion notes"}
              </div>
              {selectedJobDetail.status === "COMPLETED" ? (
                <div className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                  {selectedJobDetail.notes?.trim() || "No notes recorded."}
                </div>
              ) : (
                <>
                  <textarea
                    value={completionNotes}
                    onChange={(event) => setCompletionNotes(event.target.value)}
                    rows={5}
                    className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--border-hover)]"
                    placeholder="Add what was done, anything completed, and any follow-up needed."
                  />
                  <div className="mt-2 text-xs text-[var(--text-muted)]">
                    These notes are required before marking the job completed.
                  </div>
                </>
              )}
            </div>

            <div className={PANEL_INNER} style={panelPadding()}>
              <div className={LABEL}>Photos</div>
              <div className="mt-2 text-sm text-[var(--text-secondary)]">
                {selectedJobDetail.photo_count ?? selectedJobDetail.photos?.length ?? 0} attached
              </div>
              {Array.isArray(selectedJobDetail.photos) && selectedJobDetail.photos.length > 0 ? (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {selectedJobDetail.photos.slice(0, 4).map((photo) => (
                    <a
                      key={photo.id}
                      href={photo.url}
                      target="_blank"
                      rel="noreferrer"
                      className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]"
                    >
                      <img
                        src={photo.url}
                        alt={photo.caption || selectedJobDetail.title}
                        className="h-32 w-full object-cover"
                      />
                      {photo.caption ? (
                        <div className="px-3 py-2 text-xs text-[var(--text-secondary)]">
                          {photo.caption}
                        </div>
                      ) : null}
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="text-sm text-[var(--text-muted)]">Select a job to view its details.</div>
        )}
      </PortalDrawer>
    </div>
  );
}
