"use client";

import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Job = {
  id: string;
  title: string;
  status: string;
  scheduled_for: string;
  completed_at?: string | null;
  client_name?: string | null;
  property_name?: string | null;
  plan_name?: string | null;
  source_type?: string | null;
};

type Retainer = {
  id: string;
  service_type?: string | null;
  billing_model?: string | null;
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
const LABEL =
  "text-[10px] font-medium uppercase tracking-[0.24em] text-[var(--text-muted)]";
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

function PanelFrame({
  eyebrow,
  title,
  action,
  children,
}: {
  eyebrow: string;
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={PANEL}>
      <div className="flex flex-col gap-3 border-b border-[var(--border)] sm:flex-row sm:items-start sm:justify-between" style={panelPadding("lg")}>
        <div>
          <div className={LABEL}>{eyebrow}</div>
          <h2 className="mt-2 font-serif text-[24px] leading-none tracking-[-0.02em] text-[var(--text-primary)]">{title}</h2>
        </div>
        {action ? <div className="flex items-center gap-2">{action}</div> : null}
      </div>
      <div style={panelPadding("lg")}>{children}</div>
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

  useEffect(() => {
    load();
  }, []);

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
  const todayJobs = useMemo(() => (jobsByDay.get(todayKey) ?? []).filter((job) => job.status !== "CANCELED"), [jobsByDay, todayKey]);
  const weekBoundary = new Date();
  weekBoundary.setDate(weekBoundary.getDate() + 7);
  const weekJobs = useMemo(() => jobs.filter((job) => {
    const scheduled = new Date(job.scheduled_for).getTime();
    return scheduled >= Date.now() && scheduled <= weekBoundary.getTime() && job.status !== "CANCELED";
  }), [jobs]);
  const awaitingApproval = useMemo(() => communications.filter((item) => item.status === "DRAFT" && !item.approved_at), [communications]);
  const selectedDayJobs = useMemo(() => jobsByDay.get(selectedDayKey) ?? [], [jobsByDay, selectedDayKey]);

  const stats = useMemo(() => {
    const activePlans = retainers.filter((plan) => plan.status === "ACTIVE" && !plan.archived_at);
    return [
      { label: "Today's jobs", value: todayJobs.length, detail: "Visits and one-off work scheduled for today." },
      { label: "This week's jobs", value: weekJobs.length, detail: "Execution load across the next seven days." },
      { label: "Active plans", value: activePlans.length, detail: "Recurring agreements currently generating work." },
      { label: "Awaiting approval", value: awaitingApproval.length, detail: "Draft communications that still need owner review." },
      { label: "Outstanding balance", value: money(invoiceDashboard?.summary.outstandingBalanceCents), detail: "Open receivables across unpaid invoices.", accent: true },
    ];
  }, [awaitingApproval.length, invoiceDashboard?.summary.outstandingBalanceCents, retainers, todayJobs.length, weekJobs.length]);

  const serviceMix = useMemo(() => {
    const activePlans = retainers.filter((plan) => plan.status === "ACTIVE" && !plan.archived_at);
    const counts = new Map<string, number>();
    for (const plan of activePlans) {
      const key = String(plan.service_type ?? "CUSTOM").replaceAll("_", " ");
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [retainers]);

  return (
    <div className="space-y-6">
      <section className={PANEL} style={panelPadding("lg")}>
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className={LABEL}>Operator Dashboard</div>
            <h1 className="mt-2 font-serif text-[34px] leading-none tracking-[-0.03em] text-[var(--text-primary)]">Calendar-first command center</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">Use this view to run recurring plans, one-off jobs, communication approvals, and unpaid invoice pressure from one daily workspace.</p>
          </div>
          <div className="text-sm text-[var(--text-muted)]">{loading ? "Refreshing live operator data..." : "Operator data synced across jobs, plans, communications, and invoices."}</div>
        </div>
        {error ? <div className="mt-5 rounded-xl border border-red-900/30 bg-red-900/10 px-4 py-3 text-sm text-red-300">{error}</div> : null}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {stats.map((stat) => (
            <div key={stat.label} className={PANEL_INNER} style={stat.accent ? { ...panelPadding(), background: "linear-gradient(180deg, rgba(201,184,154,0.12) 0%, rgba(28,28,31,1) 100%)", borderColor: "rgba(201,184,154,0.18)" } : panelPadding()}>
              <div className={LABEL}>{stat.label}</div>
              <div className="mt-3 font-serif text-[28px] leading-none tracking-[-0.03em]" style={{ color: stat.accent ? "var(--accent-warm)" : "var(--text-primary)" }}>{stat.value}</div>
              <div className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{stat.detail}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.75fr)]">
        <PanelFrame eyebrow="Calendar" title="Month at a glance" action={<><button onClick={() => setViewDate(new Date())} className={BUTTON_SMALL}>Today</button><button onClick={() => setViewDate((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))} className={BUTTON_SMALL}>Prev</button><button onClick={() => setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))} className={BUTTON_SMALL}>Next</button></>}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="text-sm font-medium text-[var(--text-secondary)]">{formatMonthLabel(viewDate.getFullYear(), viewDate.getMonth())}</div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Click a day for the operator queue</div>
          </div>
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
            <div>
              <div className="grid grid-cols-7 gap-2 pb-2">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((weekday) => <div key={weekday} className={`${LABEL} text-center`}>{weekday}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {monthGrid.map((cell, index) => {
                  if (cell.kind === "blank") return <div key={`blank-${index}`} className="aspect-square rounded-2xl bg-transparent" />;
                  const count = (jobsByDay.get(cell.key) ?? []).length;
                  const isSelected = cell.key === selectedDayKey;
                  return (
                    <button key={cell.key} onClick={() => setSelectedDayKey(cell.key)} className={`aspect-square rounded-2xl border p-2 text-left transition ${isSelected ? "border-transparent bg-[var(--accent)] text-[#0e0e0f]" : "border-[var(--border)] bg-[rgba(255,255,255,0.015)] text-[var(--text-secondary)] hover:border-[var(--border-hover)] hover:bg-[var(--surface-2)]"}`}>
                      <div className="flex h-full flex-col justify-between">
                        <span className="text-sm font-medium">{cell.date.getDate()}</span>
                        <span className={`text-[10px] uppercase tracking-[0.16em] ${isSelected ? "text-[rgba(14,14,15,0.72)]" : "text-[var(--text-muted)]"}`}>{count > 0 ? `${count} job${count === 1 ? "" : "s"}` : "Open"}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className={PANEL_INNER} style={panelPadding()}>
              <div className={LABEL}>Selected Day</div>
              <div className="mt-2 text-lg font-semibold text-[var(--text-primary)]">{selectedDayKey}</div>
              <div className="mt-4 space-y-3">
                {selectedDayJobs.length === 0 ? <div className="text-sm text-[var(--text-muted)]">No jobs scheduled for this day yet.</div> : selectedDayJobs.map((job) => (
                  <div key={job.id} className="rounded-xl border border-[var(--border)] p-4">
                    <div className="text-sm font-medium text-[var(--text-primary)]">{job.title}</div>
                    <div className="mt-1 text-xs text-[var(--text-secondary)]">{job.client_name || "No client"}{job.property_name ? ` • ${job.property_name}` : ""}</div>
                    <div className="mt-1 text-xs text-[var(--text-muted)]">{fmtDate(job.scheduled_for)} • {job.source_type === "PLAN" ? job.plan_name || "Plan visit" : "One-off work"}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </PanelFrame>

        <div className="space-y-6">
          <PanelFrame eyebrow="Today" title="Immediate queue">
            <div className="space-y-3">
              {todayJobs.length === 0 ? <div className="text-sm text-[var(--text-muted)]">No jobs scheduled for today.</div> : todayJobs.map((job) => (
                <div key={job.id} className={`${PANEL_INNER} flex items-start justify-between gap-3`} style={panelPadding()}>
                  <div>
                    <div className="text-sm font-medium text-[var(--text-primary)]">{job.title}</div>
                    <div className="mt-1 text-xs text-[var(--text-secondary)]">{job.client_name || "No client"}{job.property_name ? ` • ${job.property_name}` : ""}</div>
                    <div className="mt-1 text-xs text-[var(--text-muted)]">{fmtDate(job.scheduled_for)}</div>
                  </div>
                  <div className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">{job.source_type === "PLAN" ? "Plan" : "One-off"}</div>
                </div>
              ))}
            </div>
          </PanelFrame>

          <PanelFrame eyebrow="Approvals" title="Draft communications">
            <div className="space-y-3">
              {awaitingApproval.length === 0 ? <div className="text-sm text-[var(--text-muted)]">No drafts are awaiting approval.</div> : awaitingApproval.slice(0, 5).map((item) => (
                <div key={item.id} className={`${PANEL_INNER} flex items-start justify-between gap-3`} style={panelPadding()}>
                  <div>
                    <div className="text-sm font-medium text-[var(--text-primary)]">{item.subject || item.type || "Draft"}</div>
                    <div className="mt-1 text-xs text-[var(--text-secondary)]">{item.client_name || "No client"} • {String(item.type ?? "GENERAL").replaceAll("_", " ")}</div>
                    <div className="mt-1 text-xs text-[var(--text-muted)]">Follow-up due {fmtDate(item.follow_up_due_at)}</div>
                  </div>
                  <Link href="/portal/contacts" className={BUTTON_SMALL}>Review</Link>
                </div>
              ))}
            </div>
          </PanelFrame>

          <PanelFrame eyebrow="Billing" title="Unpaid pressure">
            <div className="space-y-3">
              <div className={`${PANEL_INNER} flex items-center justify-between gap-3`} style={panelPadding()}>
                <div>
                  <div className="text-sm text-[var(--text-secondary)]">Outstanding balance</div>
                  <div className="mt-2 font-serif text-[26px] text-[var(--text-primary)]">{money(invoiceDashboard?.summary.outstandingBalanceCents)}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-[var(--text-secondary)]">Overdue</div>
                  <div className="mt-2 font-serif text-[26px] text-[#fca5a5]">{money(invoiceDashboard?.summary.overdueBalanceCents)}</div>
                </div>
              </div>
              {(invoiceDashboard?.queue.overdueInvoices ?? []).slice(0, 4).map((invoice) => (
                <div key={invoice.id} className={`${PANEL_INNER} flex items-start justify-between gap-3`} style={panelPadding()}>
                  <div>
                    <div className="text-sm font-medium text-[var(--text-primary)]">{invoice.invoice_number}</div>
                    <div className="mt-1 text-xs text-[var(--text-secondary)]">{invoice.client_name || "No client"}</div>
                    <div className="mt-1 text-xs text-[var(--text-muted)]">Due {fmtDate(invoice.due_date)}</div>
                  </div>
                  <div className="text-sm font-medium text-[var(--text-primary)]">{money(invoice.total_cents)}</div>
                </div>
              ))}
            </div>
          </PanelFrame>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.8fr)]">
        <PanelFrame eyebrow="This Week" title="Seven-day execution">
          <div className="space-y-3">
            {weekJobs.length === 0 ? <div className="text-sm text-[var(--text-muted)]">No jobs scheduled for the next seven days.</div> : weekJobs.slice(0, 8).map((job) => (
              <div key={job.id} className={`${PANEL_INNER} flex items-start justify-between gap-3`} style={panelPadding()}>
                <div>
                  <div className="text-sm font-medium text-[var(--text-primary)]">{job.title}</div>
                  <div className="mt-1 text-xs text-[var(--text-secondary)]">{job.client_name || "No client"}{job.property_name ? ` • ${job.property_name}` : ""}</div>
                  <div className="mt-1 text-xs text-[var(--text-muted)]">{fmtDate(job.scheduled_for)}</div>
                </div>
                <div className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">{job.source_type === "PLAN" ? "Plan" : "One-off"}</div>
              </div>
            ))}
          </div>
        </PanelFrame>

        <PanelFrame eyebrow="Service Mix" title="Recurring base snapshot">
          <div className="space-y-3">
            {serviceMix.length === 0 ? <div className="text-sm text-[var(--text-muted)]">No active plans yet.</div> : serviceMix.map(([label, count]) => (
              <div key={label} className={`${PANEL_INNER} flex items-center justify-between gap-3`} style={panelPadding()}>
                <div className="text-sm text-[var(--text-primary)]">{label}</div>
                <div className="font-serif text-[24px] text-[var(--text-primary)]">{count}</div>
              </div>
            ))}
          </div>
        </PanelFrame>
      </div>
    </div>
  );
}
