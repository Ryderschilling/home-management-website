"use client";

import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type Client = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  created_at?: string | null;
};

type Property = {
  id: string;
  name: string;
  client_id: string | null;
  address_line1: string | null;
};

type Job = {
  id: string;
  title: string;
  notes: string | null;
  status: string;
  scheduled_for: string;
  client_id: string | null;
  property_id: string | null;
  price_cents: number | null;
  hours_numeric: string | number | null;
  service_id?: string | null;
  completed_at?: string | null;
};

type Order = {
  id: string;
  customer_name?: string | null;
  customer_email?: string | null;
  client_name?: string | null;
  product_key?: string | null;
  rock_color?: string | null;
  total_amount_cents?: number | null;
  fulfillment_status?: string | null;
  created_at?: string | null;
  ordered_at?: string | null;
  installed_at?: string | null;
};

type MonthCell = { kind: "blank" } | { kind: "day"; date: Date; key: string };

type StatCardItem = {
  label: string;
  value: string | number;
  detail: string;
  accent?: boolean;
};

type InsightItem = {
  id: string;
  title: string;
  detail: string;
};

type TodoItem = {
  id: string;
  title: string;
  meta: string;
  tone: "warm" | "cool" | "neutral";
};

const PANEL = "rounded-[24px] border border-[var(--border)] bg-[var(--surface)] shadow-[0_22px_60px_rgba(0,0,0,0.24)]";
const PANEL_INNER = "rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]";
const LABEL =
  "text-[10px] font-medium uppercase tracking-[0.24em] text-[var(--text-muted)]";
const BUTTON_PRIMARY =
  "inline-flex items-center justify-center rounded-xl bg-[var(--accent)] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0e0e0f] transition hover:brightness-105";
const BUTTON_GHOST =
  "inline-flex items-center justify-center rounded-xl border border-[var(--border)] px-4 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--text-secondary)] transition hover:border-[var(--border-hover)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]";
const BUTTON_SMALL =
  "inline-flex items-center justify-center rounded-lg border border-[var(--border)] px-3 py-2 text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--text-secondary)] transition hover:border-[var(--border-hover)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]";
const INPUT =
  "w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--border-hover)]";

function formatMoney(cents: number | null | undefined) {
  const n = typeof cents === "number" ? cents : 0;
  return `$${(n / 100).toFixed(2)}`;
}

function toLocalDateKeyFromDate(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function toLocalDateKeyFromISO(iso: string) {
  return toLocalDateKeyFromDate(new Date(iso));
}

function formatDayLabel(dayKey: string) {
  const d = new Date(`${dayKey}T12:00:00`);
  return d.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatMonthLabel(year: number, monthIndex: number) {
  const d = new Date(year, monthIndex, 1);
  return d.toLocaleDateString([], { month: "long", year: "numeric" });
}

function daysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function startDayOfMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex, 1).getDay();
}

function toDatetimeLocalValue(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function cleanProductLabel(value: string | null | undefined) {
  if (!value) return "Order";
  return value.replaceAll("_", " ");
}

function formatShortDateTime(value: string) {
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function panelPadding(size: "base" | "lg" = "base"): CSSProperties {
  return { padding: size === "lg" ? "var(--portal-card-pad-lg)" : "var(--portal-card-pad)" };
}

function statusPillStyle(status: string): CSSProperties {
  const s = status.toUpperCase();
  if (s === "NEW")
    return {
      background: "rgba(251,191,36,0.1)",
      border: "1px solid rgba(251,191,36,0.25)",
      color: "#fbbf24",
      borderRadius: "999px",
      padding: "3px 10px",
      fontSize: "10px",
      letterSpacing: "0.15em",
      textTransform: "uppercase",
    };
  if (s === "ORDERED")
    return {
      background: "rgba(96,165,250,0.1)",
      border: "1px solid rgba(96,165,250,0.25)",
      color: "#60a5fa",
      borderRadius: "999px",
      padding: "3px 10px",
      fontSize: "10px",
      letterSpacing: "0.15em",
      textTransform: "uppercase",
    };
  if (s === "INSTALLED")
    return {
      background: "rgba(74,222,128,0.1)",
      border: "1px solid rgba(74,222,128,0.25)",
      color: "#4ade80",
      borderRadius: "999px",
      padding: "3px 10px",
      fontSize: "10px",
      letterSpacing: "0.15em",
      textTransform: "uppercase",
    };
  if (s === "CANCELED")
    return {
      background: "rgba(248,113,113,0.1)",
      border: "1px solid rgba(248,113,113,0.25)",
      color: "#f87171",
      borderRadius: "999px",
      padding: "3px 10px",
      fontSize: "10px",
      letterSpacing: "0.15em",
      textTransform: "uppercase",
    };
  if (s === "SCHEDULED")
    return {
      background: "rgba(96,165,250,0.1)",
      border: "1px solid rgba(96,165,250,0.25)",
      color: "#60a5fa",
      borderRadius: "999px",
      padding: "3px 10px",
      fontSize: "10px",
      letterSpacing: "0.15em",
      textTransform: "uppercase",
    };
  return {
    background: "var(--surface-2)",
    border: "1px solid var(--border)",
    color: "var(--text-secondary)",
    borderRadius: "999px",
    padding: "3px 10px",
    fontSize: "10px",
    letterSpacing: "0.15em",
    textTransform: "uppercase",
  };
}

function PanelFrame({
  eyebrow,
  title,
  action,
  children,
  className = "",
  bodyClassName = "",
}: {
  eyebrow: string;
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={`${PANEL} ${className}`}>
      <div
        className="flex flex-col gap-3 border-b border-[var(--border)] sm:flex-row sm:items-start sm:justify-between"
        style={panelPadding("lg")}
      >
        <div className="min-w-0">
          <div className={LABEL}>{eyebrow}</div>
          <h2 className="mt-2 font-serif text-[24px] leading-none tracking-[-0.02em] text-[var(--text-primary)]">
            {title}
          </h2>
        </div>
        {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
      </div>
      <div className={bodyClassName} style={panelPadding("lg")}>
        {children}
      </div>
    </section>
  );
}

function DashboardStatCards({
  stats,
  loading,
}: {
  stats: StatCardItem[];
  loading: boolean;
}) {
  return (
    <section className={`${PANEL} h-full`} style={panelPadding("lg")}>
      <div className="flex items-center justify-between gap-3">
        <div className={LABEL}>Snapshot</div>
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              loading ? "bg-amber-400" : "bg-emerald-400"
            }`}
            style={{ animation: "livePulse 2s infinite" }}
          />
          {loading ? "Syncing" : "Live"}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`${PANEL_INNER} min-h-[124px]`}
            style={
              stat.accent
                ? {
                    ...panelPadding(),
                    background:
                      "linear-gradient(180deg, rgba(201,184,154,0.12) 0%, rgba(28,28,31,1) 100%)",
                    borderColor: "rgba(201,184,154,0.18)",
                  }
                : panelPadding()
            }
          >
            <div className={LABEL}>{stat.label}</div>
            <div
              className="mt-4 font-serif text-[28px] leading-none tracking-[-0.03em]"
              style={{ color: stat.accent ? "var(--accent-warm)" : "var(--text-primary)" }}
            >
              {stat.value}
            </div>
            <div className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{stat.detail}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function AiInsightsPanel({
  insights,
  totalActionOrders,
}: {
  insights: InsightItem[];
  totalActionOrders: number;
}) {
  return (
    <PanelFrame
      eyebrow="AI Insights"
      title="Operational signals"
      action={<span className={`${BUTTON_SMALL} cursor-default`}>Future automations</span>}
      className="h-full"
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.9fr)]">
        <div className="space-y-3">
          {insights.map((insight, index) => (
            <div
              key={insight.id}
              className={`${PANEL_INNER} flex items-start gap-3`}
              style={panelPadding()}
            >
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[rgba(232,224,208,0.14)] bg-[rgba(232,224,208,0.08)] text-xs font-semibold text-[var(--accent-warm)]">
                0{index + 1}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-[var(--text-primary)]">{insight.title}</div>
                <div className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                  {insight.detail}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={`${PANEL_INNER} flex flex-col justify-between`} style={panelPadding()}>
          <div>
            <div className={LABEL}>Action Shelf</div>
            <div className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
              Reserve space for guided AI workflows without implying backend support that does
              not exist yet.
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {["Create invoice", "Follow up client", "Create task", "Suggest next actions"].map(
                (item) => (
                  <span
                    key={item}
                    className="inline-flex cursor-default items-center rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-3 py-2 text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--text-secondary)]"
                  >
                    {item}
                  </span>
                )
              )}
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-[rgba(96,165,250,0.18)] bg-[rgba(96,165,250,0.08)] p-4">
            <div className={LABEL}>Watchlist</div>
            <div className="mt-2 font-serif text-[26px] leading-none tracking-[-0.03em] text-[#93c5fd]">
              {totalActionOrders}
            </div>
            <div className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              Orders currently sitting in NEW or ORDERED fulfillment states.
            </div>
          </div>
        </div>
      </div>
    </PanelFrame>
  );
}

function EmailsPanel() {
  return (
    <PanelFrame eyebrow="Emails" title="Inbox slot" className="h-full">
      <div className="flex h-full flex-col justify-between gap-4">
        <div className={`${PANEL_INNER} border-dashed`} style={panelPadding()}>
          <div className="text-sm font-semibold text-[var(--text-primary)]">Integration not connected</div>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
            This panel is reserved for customer replies, estimate approvals, and follow-up
            prompts once inbox sync is wired.
          </p>
        </div>

        <div className="space-y-3">
          {["Estimate approvals", "Customer replies", "Post-service follow-up"].map((item) => (
            <div
              key={item}
              className={`${PANEL_INNER} flex items-center justify-between gap-3`}
              style={panelPadding()}
            >
              <div className="text-sm text-[var(--text-primary)]">{item}</div>
              <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Future
              </span>
            </div>
          ))}
        </div>
      </div>
    </PanelFrame>
  );
}

function TodoPanel({ items }: { items: TodoItem[] }) {
  const toneClassName: Record<TodoItem["tone"], string> = {
    warm: "bg-amber-400",
    cool: "bg-sky-400",
    neutral: "bg-[var(--border-hover)]",
  };

  return (
    <PanelFrame eyebrow="To-Do" title="Operator queue" className="h-full">
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className={`${PANEL_INNER} flex items-start gap-3`}
            style={panelPadding()}
          >
            <span className={`mt-1.5 inline-block h-2.5 w-2.5 rounded-full ${toneClassName[item.tone]}`} />
            <div className="min-w-0">
              <div className="text-sm font-medium text-[var(--text-primary)]">{item.title}</div>
              <div className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">
                {item.meta}
              </div>
            </div>
          </div>
        ))}
      </div>
    </PanelFrame>
  );
}

function CalendarPanel({
  viewYear,
  viewMonth,
  monthGrid,
  weekdayLabels,
  selectedDayKey,
  selectedDayJobs,
  jobsByDay,
  onClickDay,
  goPrevMonth,
  goNextMonth,
  jumpToday,
  openJob,
}: {
  viewYear: number;
  viewMonth: number;
  monthGrid: MonthCell[];
  weekdayLabels: string[];
  selectedDayKey: string;
  selectedDayJobs: Job[];
  jobsByDay: Map<string, Job[]>;
  onClickDay: (dayKey: string) => void;
  goPrevMonth: () => void;
  goNextMonth: () => void;
  jumpToday: () => void;
  openJob: (jobId: string) => void;
}) {
  const todayKey = toLocalDateKeyFromDate(new Date());

  return (
    <PanelFrame
      eyebrow="Calendar"
      title="Schedule board"
      action={
        <>
          <button onClick={jumpToday} className={BUTTON_SMALL}>
            Today
          </button>
          <button onClick={goPrevMonth} className={BUTTON_SMALL} aria-label="Previous month">
            ‹
          </button>
          <button onClick={goNextMonth} className={BUTTON_SMALL} aria-label="Next month">
            ›
          </button>
        </>
      }
      className="h-full"
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="text-sm font-medium text-[var(--text-secondary)]">
              {formatMonthLabel(viewYear, viewMonth)}
            </div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Click a day to inspect work
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 pb-2">
            {weekdayLabels.map((weekday) => (
              <div key={weekday} className={`${LABEL} text-center`}>
                {weekday}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {monthGrid.map((cell, index) => {
              if (cell.kind === "blank") {
                return <div key={`blank-${index}`} className="aspect-square rounded-2xl bg-transparent" />;
              }

              const isSelected = cell.key === selectedDayKey;
              const isToday = cell.key === todayKey;
              const count = (jobsByDay.get(cell.key) ?? []).length;

              return (
                <button
                  key={cell.key}
                  onClick={() => onClickDay(cell.key)}
                  className={`aspect-square rounded-2xl border p-2 text-left transition ${
                    isSelected
                      ? "border-transparent bg-[var(--accent)] text-[#0e0e0f]"
                      : isToday
                        ? "border-[rgba(201,184,154,0.28)] bg-[rgba(201,184,154,0.06)] text-[var(--accent-warm)]"
                        : "border-[var(--border)] bg-[rgba(255,255,255,0.015)] text-[var(--text-secondary)] hover:border-[var(--border-hover)] hover:bg-[var(--surface-2)]"
                  }`}
                >
                  <div className="flex h-full flex-col justify-between">
                    <span className="text-sm font-medium">{cell.date.getDate()}</span>
                    <span
                      className={`text-[10px] uppercase tracking-[0.16em] ${
                        isSelected ? "text-[rgba(14,14,15,0.72)]" : "text-[var(--text-muted)]"
                      }`}
                    >
                      {count > 0 ? `${count} job${count === 1 ? "" : "s"}` : "Open"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className={`${PANEL_INNER} flex flex-col`} style={panelPadding()}>
          <div className={LABEL}>Selected Day</div>
          <div className="mt-2 text-lg font-semibold text-[var(--text-primary)]">
            {formatDayLabel(selectedDayKey)}
          </div>
          <div className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
            {selectedDayJobs.length > 0
              ? `${selectedDayJobs.length} scheduled item${selectedDayJobs.length === 1 ? "" : "s"}`
              : "No scheduled jobs for this day yet."}
          </div>

          <div className="mt-5 space-y-3">
            {selectedDayJobs.length === 0 ? (
              <div
                className={`${PANEL_INNER} border-dashed text-center text-sm text-[var(--text-muted)]`}
                style={panelPadding()}
              >
                Open this date with the add-job form when you are ready to schedule work.
              </div>
            ) : (
              selectedDayJobs.map((job) => (
                <button
                  key={job.id}
                  onClick={() => openJob(job.id)}
                  className={`${PANEL_INNER} block w-full text-left transition hover:border-[var(--border-hover)]`}
                  style={panelPadding()}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-[var(--text-primary)]">
                        {job.title}
                      </div>
                      <div className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">
                        {formatTime(job.scheduled_for)}
                      </div>
                    </div>
                    <span style={statusPillStyle(job.status)}>{job.status}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </PanelFrame>
  );
}

function RecentJobsPanel({
  jobs,
  onSelect,
  clientName,
  propertyName,
}: {
  jobs: Job[];
  onSelect: (jobId: string) => void;
  clientName: (id: string | null) => string;
  propertyName: (id: string | null) => string;
}) {
  return (
    <PanelFrame
      eyebrow="Upcoming Jobs"
      title="Field schedule"
      action={
        <Link href="/portal/jobs" className={BUTTON_SMALL}>
          View all
        </Link>
      }
      className="h-full"
    >
      <div className="space-y-3">
        {jobs.length === 0 ? (
          <div
            className={`${PANEL_INNER} border-dashed text-center text-sm text-[var(--text-muted)]`}
            style={panelPadding()}
          >
            No future jobs are currently scheduled.
          </div>
        ) : (
          jobs.map((job) => (
            <button
              key={job.id}
              onClick={() => onSelect(job.id)}
              className={`${PANEL_INNER} block w-full text-left transition hover:border-[var(--border-hover)]`}
              style={panelPadding()}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[var(--text-primary)]">{job.title}</div>
                  <div className="mt-2 grid gap-1 text-sm text-[var(--text-secondary)]">
                    <span>{clientName(job.client_id)}</span>
                    <span>{propertyName(job.property_id)}</span>
                    <span className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">
                      {formatShortDateTime(job.scheduled_for)}
                    </span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-sm font-semibold text-[var(--accent-warm)]">
                    {formatMoney(job.price_cents)}
                  </div>
                  <div className="mt-2 text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                    {job.hours_numeric ? `${job.hours_numeric}h` : "Unassigned"}
                  </div>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </PanelFrame>
  );
}

export default function PortalDashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const now = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDayKey, setSelectedDayKey] = useState<string>(toLocalDateKeyFromDate(now));

  const [showAddJob, setShowAddJob] = useState(false);
  const [serviceId, setServiceId] = useState("");
  const [title, setTitle] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [clientId, setClientId] = useState<string>("");
  const [propertyId, setPropertyId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [price, setPrice] = useState("");
  const [hours, setHours] = useState("");
  const [recurrenceEnabled, setRecurrenceEnabled] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState("WEEKLY");
  const [recurrenceInterval, setRecurrenceInterval] = useState("1");
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");
  const [error, setError] = useState("");
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const addJobRef = useRef<HTMLDivElement | null>(null);

  async function loadAll() {
    setLoading(true);
    setError("");

    const [jobsRes, clientsRes, propsRes, servicesRes, ordersRes] = await Promise.all([
      fetch("/api/admin/jobs"),
      fetch("/api/admin/clients"),
      fetch("/api/admin/properties"),
      fetch("/api/admin/services"),
      fetch("/api/admin/orders"),
    ]);

    if (!jobsRes.ok) throw new Error("Failed to load jobs");
    if (!clientsRes.ok) throw new Error("Failed to load clients");
    if (!propsRes.ok) throw new Error("Failed to load properties");
    if (!servicesRes.ok) throw new Error("Failed to load services");
    if (!ordersRes.ok) throw new Error("Failed to load orders");

    const jobsJson = await jobsRes.json();
    const clientsJson = await clientsRes.json();
    const propsJson = await propsRes.json();
    const servicesJson = await servicesRes.json();
    const ordersJson = await ordersRes.json();

    setJobs(jobsJson.data ?? []);
    setClients(clientsJson.data ?? []);
    setProperties(propsJson.data ?? []);
    setServices(servicesJson.data ?? []);
    setOrders(ordersJson.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadAll().catch((e) => {
      setError(e instanceof Error ? e.message : "Failed to load");
      setLoading(false);
    });
  }, []);

  const jobsByDay = useMemo(() => {
    const map = new Map<string, Job[]>();

    for (const job of jobs) {
      const key = toLocalDateKeyFromISO(job.scheduled_for);
      const list = map.get(key) ?? [];
      list.push(job);
      map.set(key, list);
    }

    for (const [key, list] of map.entries()) {
      list.sort(
        (a, b) =>
          new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime()
      );
      map.set(key, list);
    }

    return map;
  }, [jobs]);

  const selectedDayJobs = useMemo(
    () => jobsByDay.get(selectedDayKey) ?? [],
    [jobsByDay, selectedDayKey]
  );

  const scheduledValue = useMemo(
    () => jobs.reduce((sum, job) => sum + (job.price_cents ?? 0), 0),
    [jobs]
  );

  const scheduledHours = useMemo(
    () =>
      jobs.reduce((sum, job) => {
        const value =
          job.hours_numeric === null || job.hours_numeric === ""
            ? 0
            : Number(job.hours_numeric);
        return sum + (Number.isNaN(value) ? 0 : value);
      }, 0),
    [jobs]
  );

  const todayKey = toLocalDateKeyFromDate(new Date());

  const todayJobs = useMemo(
    () =>
      jobs
        .filter((job) => toLocalDateKeyFromISO(job.scheduled_for) === todayKey)
        .sort(
          (a, b) =>
            new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime()
        ),
    [jobs, todayKey]
  );

  const upcomingJobs = useMemo(() => {
    const nowTs = Date.now();
    return jobs
      .filter((job) => new Date(job.scheduled_for).getTime() >= nowTs)
      .sort(
        (a, b) =>
          new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime()
      )
      .slice(0, 8);
  }, [jobs]);

  const actionOrders = useMemo(
    () =>
      orders
        .filter((order) => {
          const status = String(order.fulfillment_status ?? "NEW").toUpperCase();
          return status === "NEW" || status === "ORDERED";
        })
        .sort((a, b) => {
          const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
          const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
          return bTime - aTime;
        })
        .slice(0, 8),
    [orders]
  );

  const dashboardStats = useMemo(() => {
    const newOrders = orders.filter(
      (order) => String(order.fulfillment_status ?? "NEW").toUpperCase() === "NEW"
    ).length;
    const ordered = orders.filter(
      (order) => String(order.fulfillment_status ?? "NEW").toUpperCase() === "ORDERED"
    ).length;

    return {
      jobs: jobs.length,
      estimatedRevenue: scheduledValue,
      todayJobs: todayJobs.length,
      actionOrders: actionOrders.length,
      scheduledHours,
      newOrders,
      ordered,
    };
  }, [actionOrders.length, jobs.length, orders, scheduledHours, scheduledValue, todayJobs.length]);

  const statCards = useMemo<StatCardItem[]>(
    () => [
      {
        label: "Jobs",
        value: dashboardStats.jobs,
        detail: `${todayJobs.length} on deck today`,
      },
      {
        label: "Estimated Revenue",
        value: formatMoney(dashboardStats.estimatedRevenue),
        detail: "Scheduled work value across the current job board",
        accent: true,
      },
      {
        label: "Today's Jobs",
        value: dashboardStats.todayJobs,
        detail:
          todayJobs.length > 0
            ? `Next at ${formatTime(todayJobs[0].scheduled_for)}`
            : "No jobs scheduled today",
      },
      {
        label: "Action Orders",
        value: dashboardStats.actionOrders,
        detail: `${dashboardStats.newOrders} new / ${dashboardStats.ordered} ordered`,
      },
      {
        label: "Scheduled Hours",
        value: dashboardStats.scheduledHours.toFixed(1),
        detail: "Total scheduled labor hours currently booked",
      },
    ],
    [dashboardStats, todayJobs]
  );

  const propertiesForClient = useMemo(
    () => (!clientId ? [] : properties.filter((property) => property.client_id === clientId)),
    [properties, clientId]
  );

  useEffect(() => {
    if (!clientId) {
      setPropertyId("");
      return;
    }
    if (propertiesForClient.length === 1) {
      setPropertyId(propertiesForClient[0].id);
      return;
    }
    if (!propertiesForClient.some((property) => property.id === propertyId)) {
      setPropertyId("");
    }
  }, [clientId, propertiesForClient, propertyId]);

  const selectedService = useMemo(
    () => services.find((service: any) => service.id === serviceId) ?? null,
    [services, serviceId]
  );

  useEffect(() => {
    if (!selectedService) return;
    if (!title.trim()) setTitle(selectedService.name ?? "");
    if (!price.trim() && typeof selectedService.unit_price_cents === "number") {
      setPrice((selectedService.unit_price_cents / 100).toFixed(2));
    }
  }, [selectedService, title, price]);

  function clientName(id: string | null) {
    if (!id) return "No client assigned";
    return clients.find((client) => client.id === id)?.name ?? "Unknown client";
  }

  function propertyName(id: string | null) {
    if (!id) return "No property assigned";
    return properties.find((property) => property.id === id)?.name ?? "Unknown property";
  }

  function propertyAddress(id: string | null) {
    if (!id) return "";
    return properties.find((property) => property.id === id)?.address_line1 ?? "";
  }

  const monthGrid = useMemo<MonthCell[]>(() => {
    const firstDow = startDayOfMonth(viewYear, viewMonth);
    const dim = daysInMonth(viewYear, viewMonth);
    const cells: MonthCell[] = [];

    for (let i = 0; i < firstDow; i += 1) cells.push({ kind: "blank" });

    for (let day = 1; day <= dim; day += 1) {
      const date = new Date(viewYear, viewMonth, day, 12, 0, 0);
      cells.push({ kind: "day", date, key: toLocalDateKeyFromDate(date) });
    }

    while (cells.length % 7 !== 0) cells.push({ kind: "blank" });
    return cells;
  }, [viewMonth, viewYear]);

  const futureDayCounts = useMemo(() => {
    const startTs = new Date(`${todayKey}T00:00:00`).getTime();

    return Array.from(jobsByDay.entries())
      .filter(([dayKey]) => new Date(`${dayKey}T00:00:00`).getTime() >= startTs)
      .sort((a, b) => a[0].localeCompare(b[0]));
  }, [jobsByDay, todayKey]);

  const busiestUpcomingDay = useMemo(() => {
    return futureDayCounts
      .filter(([, items]) => items.length > 0)
      .sort((a, b) => {
        const countDiff = b[1].length - a[1].length;
        if (countDiff !== 0) return countDiff;
        return a[0].localeCompare(b[0]);
      })[0] ?? null;
  }, [futureDayCounts]);

  const todayValue = useMemo(
    () => todayJobs.reduce((sum, job) => sum + (job.price_cents ?? 0), 0),
    [todayJobs]
  );

  const aiInsights = useMemo<InsightItem[]>(() => {
    const insights: InsightItem[] = [];

    if (actionOrders.length > 0) {
      insights.push({
        id: "orders",
        title: `${actionOrders.length} fulfillment items still need movement`,
        detail: `${dashboardStats.newOrders} order${dashboardStats.newOrders === 1 ? "" : "s"} are still NEW and ${dashboardStats.ordered} are already ordered but waiting on the next field step.`,
      });
    }

    if (busiestUpcomingDay) {
      insights.push({
        id: "load",
        title: `${busiestUpcomingDay[1].length} jobs cluster on ${formatDayLabel(
          busiestUpcomingDay[0]
        )}`,
        detail:
          "Use this day as the first place to rebalance crews, tighten arrival windows, or pull prep tasks forward.",
      });
    }

    if (todayJobs.length > 0) {
      insights.push({
        id: "today",
        title: `${todayJobs.length} jobs are booked today for ${formatMoney(todayValue)}`,
        detail: upcomingJobs[0]
          ? `Next scheduled stop is ${upcomingJobs[0].title} at ${formatTime(upcomingJobs[0].scheduled_for)}.`
          : "The live calendar is already centered on today for quick dispatch review.",
      });
    } else {
      insights.push({
        id: "today-empty",
        title: "Today is clear on the dispatch board",
        detail:
          "Use the open capacity to backfill jobs, follow up active orders, or batch upcoming prep work.",
      });
    }

    return insights.slice(0, 3);
  }, [actionOrders.length, busiestUpcomingDay, dashboardStats.newOrders, dashboardStats.ordered, todayJobs, todayValue, upcomingJobs]);

  const todoItems = useMemo<TodoItem[]>(() => {
    const items: TodoItem[] = [];

    actionOrders
      .filter((order) => String(order.fulfillment_status ?? "NEW").toUpperCase() === "NEW")
      .slice(0, 2)
      .forEach((order) => {
        items.push({
          id: `order-new-${order.id}`,
          title: `Place ${cleanProductLabel(order.product_key)} order for ${order.customer_name || order.client_name || "client"}`,
          meta: "Orders · NEW fulfillment",
          tone: "warm",
        });
      });

    actionOrders
      .filter((order) => String(order.fulfillment_status ?? "NEW").toUpperCase() === "ORDERED")
      .slice(0, 2)
      .forEach((order) => {
        items.push({
          id: `order-ordered-${order.id}`,
          title: `Confirm install timing for ${order.customer_name || order.client_name || "client"}`,
          meta: "Orders · ORDERED follow-up",
          tone: "cool",
        });
      });

    todayJobs.slice(0, 2).forEach((job) => {
      items.push({
        id: `job-today-${job.id}`,
        title: `Prep ${job.title}`,
        meta: `Today · ${formatTime(job.scheduled_for)}`,
        tone: "neutral",
      });
    });

    if (items.length === 0) {
      items.push({
        id: "todo-empty",
        title: "No urgent operator tasks generated from current live data",
        meta: "Queue · Standing by",
        tone: "neutral",
      });
    }

    return items.slice(0, 6);
  }, [actionOrders, todayJobs]);

  function goPrevMonth() {
    const d = new Date(viewYear, viewMonth - 1, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }

  function goNextMonth() {
    const d = new Date(viewYear, viewMonth + 1, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }

  function jumpToday() {
    const d = new Date();
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
    setSelectedDayKey(toLocalDateKeyFromDate(d));
  }

  function onClickDay(dayKey: string) {
    setSelectedDayKey(dayKey);
    if (showAddJob && !scheduledFor.trim()) {
      setScheduledFor(toDatetimeLocalValue(new Date(`${dayKey}T09:00:00`)));
    }
  }

  function openAddJob() {
    setShowAddJob(true);
    if (!scheduledFor.trim()) {
      setScheduledFor(toDatetimeLocalValue(new Date(`${selectedDayKey}T09:00:00`)));
    }
    setTimeout(() => addJobRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  async function deleteActiveJob() {
    if (!activeJobId) return;
    if (!window.confirm("Delete this task permanently?")) return;

    try {
      setError("");
      const res = await fetch(`/api/admin/jobs/${activeJobId}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        throw new Error(json?.error?.message ?? "Failed to delete task");
      }
      setActiveJobId(null);
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete task");
    }
  }

  async function createJob() {
    setError("");

    if (!serviceId && !title.trim()) {
      setError("Title is required");
      return;
    }
    if (!scheduledFor) {
      setError("Scheduled date/time is required");
      return;
    }
    if (!clientId) {
      setError("Client is required");
      return;
    }
    if (!propertyId) {
      setError("Property is required");
      return;
    }

    const priceCents = price.trim() === "" ? null : Math.round(Number(price) * 100);
    if (priceCents !== null && (Number.isNaN(priceCents) || priceCents < 0)) {
      setError("Price must be a valid number");
      return;
    }

    const hoursNum = hours.trim() === "" ? null : Number(hours);
    if (hoursNum !== null && (Number.isNaN(hoursNum) || hoursNum < 0)) {
      setError("Hours must be a valid number");
      return;
    }

    if (recurrenceEnabled && !recurrenceEndDate) {
      setError("Repeat until date is required for recurring jobs");
      return;
    }

    const res = await fetch("/api/admin/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        scheduledFor: new Date(scheduledFor).toISOString(),
        clientId,
        propertyId,
        serviceId: serviceId || null,
        notes: notes.trim() || null,
        priceCents: priceCents === null ? "" : priceCents,
        hours: hoursNum === null ? "" : hoursNum,
        recurrenceEnabled,
        recurrenceFrequency: recurrenceEnabled ? recurrenceFrequency : null,
        recurrenceInterval: recurrenceEnabled ? Number(recurrenceInterval || "1") : null,
        recurrenceEndDate:
          recurrenceEnabled && recurrenceEndDate
            ? new Date(`${recurrenceEndDate}T23:59:59`).toISOString()
            : null,
      }),
    });

    const json = await res.json();
    if (!res.ok || !json.ok) {
      setError(json?.error?.message ?? "Failed to create job");
      return;
    }

    setServiceId("");
    setTitle("");
    setNotes("");
    setPrice("");
    setHours("");
    setClientId("");
    setPropertyId("");
    setRecurrenceEnabled(false);
    setRecurrenceFrequency("WEEKLY");
    setRecurrenceInterval("1");
    setRecurrenceEndDate("");
    await loadAll();
    setSelectedDayKey(toLocalDateKeyFromISO(json?.data?.scheduled_for ?? new Date().toISOString()));
    setShowAddJob(false);
  }

  const activeJob = useMemo(
    () => (!activeJobId ? null : jobs.find((job) => job.id === activeJobId) ?? null),
    [activeJobId, jobs]
  );

  const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="space-y-6 pb-2">
      <section className="grid gap-4 xl:grid-cols-[minmax(280px,0.95fr)_minmax(0,1.7fr)]">
        <section className={`${PANEL} h-full`} style={panelPadding("lg")}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className={LABEL}>Dashboard</div>
              <h1 className="mt-3 font-serif text-[40px] leading-none tracking-[-0.04em] text-[var(--text-primary)]">
                Command center
              </h1>
              <p className="mt-4 max-w-[28rem] text-sm leading-7 text-[var(--text-secondary)]">
                Live scheduling, fulfillment, and customer workstreams stay in one operator-first
                surface.
              </p>
            </div>
            <div className="rounded-full border border-[var(--border)] px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
              {loading ? "Syncing" : "Ready"}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <button onClick={openAddJob} className={BUTTON_PRIMARY}>
              Add job
            </button>
            <Link href="/portal/orders" className={BUTTON_GHOST}>
              Orders
            </Link>
            <Link href="/portal/jobs" className={BUTTON_GHOST}>
              Jobs
            </Link>
            <Link href="/portal/clients" className={BUTTON_GHOST}>
              Clients
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className={`${PANEL_INNER}`} style={panelPadding()}>
              <div className={LABEL}>Today</div>
              <div className="mt-2 text-lg font-semibold text-[var(--text-primary)]">
                {todayJobs.length > 0 ? `${todayJobs.length} scheduled stop${todayJobs.length === 1 ? "" : "s"}` : "Open day"}
              </div>
              <div className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                {todayJobs[0]
                  ? `Next up is ${todayJobs[0].title} at ${formatTime(todayJobs[0].scheduled_for)}.`
                  : "No jobs are currently booked for today."}
              </div>
            </div>

            <div className={`${PANEL_INNER}`} style={panelPadding()}>
              <div className={LABEL}>Load</div>
              <div className="mt-2 text-lg font-semibold text-[var(--text-primary)]">
                {busiestUpcomingDay
                  ? `${busiestUpcomingDay[1].length} jobs on ${new Date(`${busiestUpcomingDay[0]}T12:00:00`).toLocaleDateString([], { month: "short", day: "numeric" })}`
                  : "No future clustering"}
              </div>
              <div className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                {busiestUpcomingDay
                  ? "Use the AI panel below as the first review point for schedule balancing."
                  : "As new work is scheduled, this block highlights the next dense dispatch day."}
              </div>
            </div>
          </div>
        </section>

        <DashboardStatCards stats={statCards} loading={loading} />
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-900/30 bg-red-900/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.75fr)_minmax(320px,0.95fr)]">
        <AiInsightsPanel insights={aiInsights} totalActionOrders={actionOrders.length} />

        <div className="grid gap-4">
          <EmailsPanel />
          <TodoPanel items={todoItems} />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.95fr)]">
        <CalendarPanel
          viewYear={viewYear}
          viewMonth={viewMonth}
          monthGrid={monthGrid}
          weekdayLabels={weekdayLabels}
          selectedDayKey={selectedDayKey}
          selectedDayJobs={selectedDayJobs}
          jobsByDay={jobsByDay}
          onClickDay={onClickDay}
          goPrevMonth={goPrevMonth}
          goNextMonth={goNextMonth}
          jumpToday={jumpToday}
          openJob={(jobId) => setActiveJobId(jobId)}
        />

        <RecentJobsPanel
          jobs={upcomingJobs}
          onSelect={(jobId) => setActiveJobId(jobId)}
          clientName={clientName}
          propertyName={propertyName}
        />
      </section>

      {showAddJob ? (
        <section ref={addJobRef} className={PANEL}>
          <div
            className="flex flex-col gap-4 border-b border-[var(--border)] sm:flex-row sm:items-start sm:justify-between"
            style={panelPadding("lg")}
          >
            <div>
              <div className={LABEL}>Add Job</div>
              <h2 className="mt-2 font-serif text-[28px] leading-none tracking-[-0.02em] text-[var(--text-primary)]">
                Schedule new work
              </h2>
              <p className="mt-3 max-w-[36rem] text-sm leading-7 text-[var(--text-secondary)]">
                Reuse the existing service and recurrence logic while keeping the form anchored
                inside the dashboard.
              </p>
            </div>
            <button onClick={() => setShowAddJob(false)} className={BUTTON_GHOST}>
              Close
            </button>
          </div>

          <div style={panelPadding("lg")}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <div className={`${LABEL} mb-2`}>Service</div>
                <select
                  className={INPUT}
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                >
                  <option value="">Custom job / no predefined service</option>
                  {services.map((service: any) => (
                    <option key={service.id} value={service.id}>
                      {service.name} — ${(service.unit_price_cents / 100).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className={`${LABEL} mb-2`}>Title</div>
                <input
                  className={INPUT}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Custom job title"
                />
              </div>

              <div>
                <div className={`${LABEL} mb-2`}>Scheduled for</div>
                <input
                  type="datetime-local"
                  className={INPUT}
                  value={scheduledFor}
                  onChange={(e) => setScheduledFor(e.target.value)}
                />
              </div>

              <div>
                <div className={`${LABEL} mb-2`}>Client</div>
                <select
                  className={INPUT}
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                >
                  <option value="">Select client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className={`${LABEL} mb-2`}>Property</div>
                <select
                  className={INPUT}
                  value={propertyId}
                  onChange={(e) => setPropertyId(e.target.value)}
                  disabled={!clientId || propertiesForClient.length === 0}
                >
                  <option value="">
                    {!clientId
                      ? "Select client first"
                      : propertiesForClient.length === 0
                        ? "No properties for this client"
                        : "Select property"}
                  </option>
                  {propertiesForClient.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.name}
                      {property.address_line1 ? ` — ${property.address_line1}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className={`${LABEL} mb-2`}>Price (USD)</div>
                <input
                  className={INPUT}
                  placeholder="e.g. 125"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>

              <div>
                <div className={`${LABEL} mb-2`}>Hours</div>
                <input
                  className={INPUT}
                  placeholder="e.g. 1.5"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                />
              </div>

              <div className={`${PANEL_INNER} md:col-span-2`} style={panelPadding()}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className={LABEL}>Recurring schedule</div>
                    <div className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                      Repeat this job on a schedule without changing any of the existing business
                      rules.
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <input
                      type="checkbox"
                      checked={recurrenceEnabled}
                      onChange={(e) => setRecurrenceEnabled(e.target.checked)}
                    />
                    Enable
                  </label>
                </div>

                {recurrenceEnabled ? (
                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div>
                      <div className={`${LABEL} mb-2`}>Frequency</div>
                      <select
                        className={INPUT}
                        value={recurrenceFrequency}
                        onChange={(e) => setRecurrenceFrequency(e.target.value)}
                      >
                        <option value="DAILY">Daily</option>
                        <option value="WEEKLY">Weekly</option>
                        <option value="MONTHLY">Monthly</option>
                      </select>
                    </div>

                    <div>
                      <div className={`${LABEL} mb-2`}>Every</div>
                      <input
                        className={INPUT}
                        value={recurrenceInterval}
                        onChange={(e) => setRecurrenceInterval(e.target.value)}
                        placeholder="1"
                      />
                    </div>

                    <div>
                      <div className={`${LABEL} mb-2`}>Repeat until</div>
                      <input
                        type="date"
                        className={INPUT}
                        value={recurrenceEndDate}
                        onChange={(e) => setRecurrenceEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-4">
              <div className={`${LABEL} mb-2`}>Notes</div>
              <textarea
                className={`${INPUT} min-h-[130px] resize-y`}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Access notes, supplies used, special client requests, issues found..."
              />
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={createJob} className={BUTTON_PRIMARY}>
                Save job
              </button>
              <button onClick={() => setShowAddJob(false)} className={BUTTON_GHOST}>
                Cancel
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {activeJob ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setActiveJobId(null)}
        >
          <div
            className={`${PANEL} w-full max-w-[620px]`}
            style={{ ...panelPadding("lg"), boxShadow: "0 24px 80px rgba(0,0,0,0.42)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className={LABEL}>Job Detail</div>
                <h2 className="mt-2 font-serif text-[32px] leading-none tracking-[-0.03em] text-[var(--text-primary)]">
                  {activeJob.title}
                </h2>
                <div className="mt-3 text-sm uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  {formatShortDateTime(activeJob.scheduled_for)}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={deleteActiveJob}
                  className="inline-flex items-center justify-center rounded-xl border border-red-900/40 bg-red-900/10 px-4 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-red-400 transition hover:bg-red-900/20"
                >
                  Delete
                </button>
                <button onClick={() => setActiveJobId(null)} className={BUTTON_GHOST}>
                  Close
                </button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                { label: "Client", value: clientName(activeJob.client_id) },
                {
                  label: "Property",
                  value: propertyName(activeJob.property_id),
                  sub: propertyAddress(activeJob.property_id) || undefined,
                },
                { label: "Status", value: activeJob.status },
                {
                  label: "Value / Hours",
                  value: `${formatMoney(activeJob.price_cents)} · ${
                    activeJob.hours_numeric ? `${activeJob.hours_numeric}h` : "—"
                  }`,
                },
              ].map((field) => (
                <div key={field.label} className={PANEL_INNER} style={panelPadding()}>
                  <div className={LABEL}>{field.label}</div>
                  <div className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
                    {field.value}
                  </div>
                  {field.sub ? (
                    <div className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                      {field.sub}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>

            <div className={`${PANEL_INNER} mt-4`} style={panelPadding()}>
              <div className={LABEL}>Notes</div>
              <div
                className="mt-3 text-sm leading-7"
                style={{ color: activeJob.notes ? "var(--text-primary)" : "var(--text-muted)" }}
              >
                {activeJob.notes || "—"}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
