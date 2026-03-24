"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

type AnalyticsRangeKey = "30D" | "90D" | "12M" | "ALL";

type RevenueTrendPoint = {
  key: string;
  label: string;
  revenueCents: number;
};

type OperationsTrendPoint = {
  key: string;
  label: string;
  scheduledCount: number;
  completedCount: number;
};

type OrderTrendPoint = {
  key: string;
  label: string;
  orderCount: number;
  orderRevenueCents: number;
};

type ClientRevenueRow = {
  clientId?: string | null;
  clientName?: string | null;
  name: string;
  revenueCents: number;
  invoiceCount: number;
};

type ServiceRevenueRow = {
  serviceId?: string | null;
  name: string;
  revenueCents: number;
  jobCount: number;
  lineItemCount: number;
};

type ClientPlanRow = {
  clientId: string;
  clientName: string;
  planCount: number;
  mrrCents: number;
};

type ClientOverdueRow = {
  clientId: string;
  clientName: string;
  overdueInvoices: number;
  overdueAmountCents: number;
};

type ClientNoRecentJobsRow = {
  clientId: string;
  clientName: string;
  activePlanCount: number;
  lastJobAt: string | null;
};

type StatusBreakdownRow = {
  status: string;
  count: number;
};

type AgingBucketRow = {
  label: string;
  count: number;
  amountCents: number;
};

type AnalyticsPayload = {
  generatedAt: string;
  range: {
    key: AnalyticsRangeKey;
    label: string;
    since: string | null;
    until: string;
    bucket: "day" | "week" | "month";
    noRecentJobsLookbackStart: string;
  };
  kpis: {
    revenueCents: number;
    outstandingInvoiceCents: number;
    activePlans: number;
    jobsScheduled: number;
    jobsCompleted: number;
    activeClients: number;
  };
  revenue: {
    trend: RevenueTrendPoint[];
    byClient: ClientRevenueRow[];
    byService: ServiceRevenueRow[];
    mrrCents: number;
  };
  operations: {
    scheduledVsCompleted: OperationsTrendPoint[];
    completionRate: number;
    canceledJobs: number;
    overdueJobs: number;
    laborHoursScheduled: number;
    laborHoursCompleted: number;
  };
  billing: {
    invoiceCounts: {
      total: number;
      draft: number;
      sent: number;
      paid: number;
      overdue: number;
      void: number;
    };
    outstandingCents: number;
    overdueCents: number;
    agingBuckets: AgingBucketRow[];
    clientsWithOverdueInvoices: number;
  };
  clients: {
    topByRevenue: ClientRevenueRow[];
    clientsWithActivePlans: ClientPlanRow[];
    clientsWithOverdueInvoices: ClientOverdueRow[];
    clientsWithNoRecentJobs: ClientNoRecentJobsRow[];
  };
  orders: {
    totalOrders: number;
    revenueCents: number;
    statusBreakdown: StatusBreakdownRow[];
    trend: OrderTrendPoint[];
  };
};

const RANGE_OPTIONS: { key: AnalyticsRangeKey; label: string }[] = [
  { key: "30D", label: "30D" },
  { key: "90D", label: "90D" },
  { key: "12M", label: "12M" },
  { key: "ALL", label: "ALL" },
];

const S = {
  card: "rounded-2xl border border-[var(--border)] bg-[var(--surface)]",
  cardInner: "rounded-xl border border-[var(--border)] bg-[var(--surface-2)]",
  btnGhost:
    "inline-flex items-center justify-center rounded-lg border border-[var(--border)] px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-[var(--text-secondary)] transition hover:border-[var(--border-hover)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]",
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("en-US");

function money(cents: number | null | undefined) {
  return currencyFormatter.format((typeof cents === "number" ? cents : 0) / 100);
}

function integer(value: number | null | undefined) {
  return numberFormatter.format(typeof value === "number" ? value : 0);
}

function percent(value: number | null | undefined) {
  const safe = typeof value === "number" && Number.isFinite(value) ? value : 0;
  return `${(safe * 100).toFixed(1)}%`;
}

function hours(value: number | null | undefined) {
  const safe = typeof value === "number" && Number.isFinite(value) ? value : 0;
  return `${safe.toFixed(1)}h`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "No jobs yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No jobs yet";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function statusTone(status: string): CSSProperties {
  const normalized = status.toUpperCase();
  if (normalized === "PAID" || normalized === "COMPLETED" || normalized === "INSTALLED") {
    return {
      background: "rgba(74,222,128,0.1)",
      border: "1px solid rgba(74,222,128,0.25)",
      color: "#4ade80",
    };
  }

  if (normalized === "SENT" || normalized === "SCHEDULED" || normalized === "ORDERED") {
    return {
      background: "rgba(96,165,250,0.1)",
      border: "1px solid rgba(96,165,250,0.25)",
      color: "#60a5fa",
    };
  }

  if (normalized === "OVERDUE" || normalized === "CANCELED" || normalized === "VOID") {
    return {
      background: "rgba(248,113,113,0.1)",
      border: "1px solid rgba(248,113,113,0.24)",
      color: "#f87171",
    };
  }

  return {
    background: "rgba(251,191,36,0.1)",
    border: "1px solid rgba(251,191,36,0.24)",
    color: "#fbbf24",
  };
}

function buildLinePath(values: number[], width: number, height: number) {
  if (values.length === 0) return "";
  const max = Math.max(...values, 1);

  return values
    .map((value, index) => {
      const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
      const y = height - (value / max) * height;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function buildAreaPath(values: number[], width: number, height: number) {
  if (values.length === 0) return "";
  const linePath = buildLinePath(values, width, height);
  return `${linePath} L ${width} ${height} L 0 ${height} Z`;
}

function SectionCard({
  eyebrow,
  title,
  detail,
  action,
  children,
}: {
  eyebrow: string;
  title: string;
  detail?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={S.card}>
      <div className="flex flex-col gap-4 border-b border-[var(--border)] px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-7">
        <div>
          <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--text-muted)]">
            {eyebrow}
          </div>
          <h2
            style={{
              fontFamily: "var(--font-serif), 'Instrument Serif', serif",
              fontSize: 26,
              color: "var(--text-primary)",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              marginTop: 8,
            }}
          >
            {title}
          </h2>
          {detail ? (
            <p className="mt-2 max-w-[720px] text-sm text-[var(--text-secondary)]">{detail}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="px-5 py-5 sm:px-7 sm:py-6">{children}</div>
    </section>
  );
}

function KpiCard({
  label,
  value,
  detail,
  accent = false,
}: {
  label: string;
  value: string;
  detail: string;
  accent?: boolean;
}) {
  return (
    <div className={S.cardInner} style={{ padding: "16px 18px" }}>
      <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--text-muted)]">
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--font-serif), 'Instrument Serif', serif",
          fontSize: 28,
          color: accent ? "var(--accent-warm, #c9b89a)" : "var(--text-primary)",
          lineHeight: 1,
          marginTop: 10,
        }}
      >
        {value}
      </div>
      <div className="mt-2 text-xs text-[var(--text-secondary)]">{detail}</div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className={`${S.cardInner} px-4 py-5 text-sm text-[var(--text-muted)]`}>{message}</div>
  );
}

function LineChart({
  title,
  subtitle,
  primaryValues,
  secondaryValues,
  labels,
  primaryColor = "#c9b89a",
  secondaryColor = "#60a5fa",
}: {
  title: string;
  subtitle: string;
  primaryValues: number[];
  secondaryValues?: number[];
  labels: string[];
  primaryColor?: string;
  secondaryColor?: string;
}) {
  const width = 560;
  const height = 180;
  const mergedValues = secondaryValues ? [...primaryValues, ...secondaryValues] : primaryValues;
  const safeValues = mergedValues.length > 0 ? mergedValues : [0];
  const max = Math.max(...safeValues, 1);
  const normalizedPrimary = primaryValues.length > 0 ? primaryValues : [0];
  const normalizedSecondary = secondaryValues && secondaryValues.length > 0 ? secondaryValues : undefined;

  return (
    <div className={S.cardInner} style={{ padding: "18px 18px 16px" }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-[var(--text-primary)]">{title}</div>
          <div className="mt-1 text-xs text-[var(--text-muted)]">{subtitle}</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
            Peak
          </div>
          <div className="mt-1 text-sm font-medium text-[var(--text-primary)]">
            {integer(max)}
          </div>
        </div>
      </div>

      <div className="mt-5">
        <svg viewBox={`0 0 ${width} ${height + 26}`} className="w-full overflow-visible">
          <defs>
            <linearGradient id="analyticsPrimaryFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={primaryColor} stopOpacity="0.36" />
              <stop offset="100%" stopColor={primaryColor} stopOpacity="0.03" />
            </linearGradient>
          </defs>

          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = height - height * ratio;
            return (
              <line
                key={ratio}
                x1="0"
                x2={width}
                y1={y}
                y2={y}
                stroke="rgba(232,224,208,0.08)"
                strokeWidth="1"
              />
            );
          })}

          <path
            d={buildAreaPath(normalizedPrimary, width, height)}
            fill="url(#analyticsPrimaryFill)"
          />
          <path
            d={buildLinePath(normalizedPrimary, width, height)}
            fill="none"
            stroke={primaryColor}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {normalizedSecondary ? (
            <path
              d={buildLinePath(normalizedSecondary, width, height)}
              fill="none"
              stroke={secondaryColor}
              strokeWidth="2.25"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="6 6"
            />
          ) : null}

          {labels.length > 0
            ? labels.map((label, index) => {
                const x =
                  labels.length === 1 ? width / 2 : (index / (labels.length - 1)) * width;
                return (
                  <text
                    key={`${label}-${index}`}
                    x={x}
                    y={height + 20}
                    textAnchor={index === 0 ? "start" : index === labels.length - 1 ? "end" : "middle"}
                    fill="var(--text-muted)"
                    fontSize="10"
                    letterSpacing="0.04em"
                  >
                    {label}
                  </text>
                );
              })
            : null}
        </svg>
      </div>
    </div>
  );
}

function HorizontalBars({
  title,
  subtitle,
  rows,
  valueLabel,
  color = "var(--accent-warm, #c9b89a)",
}: {
  title: string;
  subtitle: string;
  rows: Array<{ label: string; value: number; detail?: string }>;
  valueLabel: (value: number) => string;
  color?: string;
}) {
  const max = Math.max(...rows.map((row) => row.value), 1);

  return (
    <div className={S.cardInner} style={{ padding: 18 }}>
      <div className="text-sm font-medium text-[var(--text-primary)]">{title}</div>
      <div className="mt-1 text-xs text-[var(--text-muted)]">{subtitle}</div>

      <div className="mt-5 space-y-4">
        {rows.length === 0 ? (
          <div className="text-sm text-[var(--text-muted)]">No data in this range.</div>
        ) : (
          rows.map((row) => (
            <div key={row.label}>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-[var(--text-primary)]">
                    {row.label}
                  </div>
                  {row.detail ? (
                    <div className="mt-0.5 truncate text-xs text-[var(--text-muted)]">
                      {row.detail}
                    </div>
                  ) : null}
                </div>
                <div className="shrink-0 text-sm text-[var(--text-secondary)]">
                  {valueLabel(row.value)}
                </div>
              </div>
              <div className="mt-2 h-2 rounded-full bg-[rgba(255,255,255,0.05)]">
                <div
                  className="h-2 rounded-full"
                  style={{
                    width: `${Math.max((row.value / max) * 100, row.value > 0 ? 6 : 0)}%`,
                    background: color,
                    boxShadow: "0 0 0 1px rgba(255,255,255,0.04)",
                  }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ListTable({
  title,
  subtitle,
  columns,
  rows,
  empty,
}: {
  title: string;
  subtitle: string;
  columns: string[];
  rows: ReactNode[][];
  empty: string;
}) {
  return (
    <div className={S.cardInner}>
      <div className="border-b border-[var(--border)] px-4 py-4">
        <div className="text-sm font-medium text-[var(--text-primary)]">{title}</div>
        <div className="mt-1 text-xs text-[var(--text-muted)]">{subtitle}</div>
      </div>
      {rows.length === 0 ? (
        <div className="px-4 py-5 text-sm text-[var(--text-muted)]">{empty}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="border-b border-[var(--border)] bg-[rgba(255,255,255,0.02)]">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column}
                    className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-b border-[var(--border)] last:border-b-0">
                  {row.map((cell, cellIndex) => (
                    <td key={`${rowIndex}-${cellIndex}`} className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function PortalAnalyticsPage() {
  const [range, setRange] = useState<AnalyticsRangeKey>("30D");
  const [analytics, setAnalytics] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`/api/admin/analytics?range=${range}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const json = await response.json().catch(() => ({}));

        if (!response.ok || !json.ok) {
          throw new Error(json?.error?.message ?? "Failed to load analytics");
        }

        setAnalytics(json.data as AnalyticsPayload);
      } catch (loadError) {
        if (controller.signal.aborted) return;
        setError(loadError instanceof Error ? loadError.message : "Failed to load analytics");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [range]);

  const revenueChart = useMemo(
    () => ({
      values: analytics?.revenue.trend.map((point) => point.revenueCents) ?? [],
      labels:
        analytics?.revenue.trend.map((point, index, all) => {
          if (all.length <= 5) return point.label;
          if (index === 0 || index === all.length - 1) return point.label;
          const step = Math.max(Math.floor(all.length / 4), 1);
          return index % step === 0 ? point.label : "";
        }) ?? [],
    }),
    [analytics]
  );

  const operationsChart = useMemo(
    () => ({
      scheduled: analytics?.operations.scheduledVsCompleted.map((point) => point.scheduledCount) ?? [],
      completed: analytics?.operations.scheduledVsCompleted.map((point) => point.completedCount) ?? [],
      labels:
        analytics?.operations.scheduledVsCompleted.map((point, index, all) => {
          if (all.length <= 5) return point.label;
          if (index === 0 || index === all.length - 1) return point.label;
          const step = Math.max(Math.floor(all.length / 4), 1);
          return index % step === 0 ? point.label : "";
        }) ?? [],
    }),
    [analytics]
  );

  const ordersChart = useMemo(
    () => ({
      values: analytics?.orders.trend.map((point) => point.orderCount) ?? [],
      labels:
        analytics?.orders.trend.map((point, index, all) => {
          if (all.length <= 5) return point.label;
          if (index === 0 || index === all.length - 1) return point.label;
          const step = Math.max(Math.floor(all.length / 4), 1);
          return index % step === 0 ? point.label : "";
        }) ?? [],
    }),
    [analytics]
  );

  const rangeDescription = analytics?.range.label ?? "Selected range";

  return (
    <div className="space-y-6">
      <section className={S.card}>
        <div className="flex flex-col gap-6 px-5 py-6 sm:px-7 sm:py-7 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--text-muted)]">
              Business Analytics
            </div>
            <h1
              style={{
                fontFamily: "var(--font-serif), 'Instrument Serif', serif",
                fontSize: 34,
                color: "var(--text-primary)",
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
                marginTop: 10,
              }}
            >
              Financial and operating performance
            </h1>
            <p className="mt-3 max-w-[760px] text-sm text-[var(--text-secondary)]">
              Revenue, jobs, receivables, client health, and order fulfillment for the operator
              portal. Revenue and activity metrics follow the selected window, while plans and
              receivables remain current-state snapshots.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {RANGE_OPTIONS.map((option) => {
              const active = range === option.key;
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setRange(option.key)}
                  className="rounded-lg px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] transition"
                  style={
                    active
                      ? {
                          background: "var(--accent)",
                          color: "#0e0e0f",
                          border: "1px solid transparent",
                        }
                      : {
                          background: "transparent",
                          color: "var(--text-secondary)",
                          border: "1px solid var(--border)",
                        }
                  }
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-900/30 bg-red-900/10 px-5 py-4 text-sm text-red-400">
          {error}
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <KpiCard
          label="Revenue"
          value={loading ? "…" : money(analytics?.kpis.revenueCents)}
          detail={`${rangeDescription} invoiced revenue`}
          accent
        />
        <KpiCard
          label="Outstanding Invoices"
          value={loading ? "…" : money(analytics?.kpis.outstandingInvoiceCents)}
          detail="Open receivables on sent and overdue invoices"
        />
        <KpiCard
          label="Active Plans"
          value={loading ? "…" : integer(analytics?.kpis.activePlans)}
          detail={`Current recurring plans • MRR ${money(analytics?.revenue.mrrCents)}`}
        />
        <KpiCard
          label="Jobs Scheduled"
          value={loading ? "…" : integer(analytics?.kpis.jobsScheduled)}
          detail={`${rangeDescription} scheduled workload`}
        />
        <KpiCard
          label="Jobs Completed"
          value={loading ? "…" : integer(analytics?.kpis.jobsCompleted)}
          detail={`${rangeDescription} completed visits`}
        />
        <KpiCard
          label="Active Clients"
          value={loading ? "…" : integer(analytics?.kpis.activeClients)}
          detail="Clients with current plans or recent business activity"
        />
      </section>

      <SectionCard
        eyebrow="Revenue"
        title="Revenue performance"
        detail="Revenue uses issued invoice activity in the selected period. MRR reflects the monthlyized run rate of active plans."
      >
        {loading || !analytics ? (
          <EmptyState message="Loading revenue analytics…" />
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(360px,1fr)]">
            <div className="space-y-4">
              <LineChart
                title="Revenue trend"
                subtitle={`${analytics.revenue.trend.length} periods in ${analytics.range.label.toLowerCase()}`}
                primaryValues={revenueChart.values}
                labels={revenueChart.labels}
              />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <HorizontalBars
                  title="Revenue by client"
                  subtitle="Top clients by invoiced revenue"
                  rows={analytics.revenue.byClient.map((row) => ({
                    label: row.name,
                    value: row.revenueCents,
                    detail: `${integer(row.invoiceCount)} invoices`,
                  }))}
                  valueLabel={(value) => money(value)}
                />
                <HorizontalBars
                  title="Revenue by service"
                  subtitle="Mapped from invoice lines and linked jobs"
                  rows={analytics.revenue.byService.map((row) => ({
                    label: row.name,
                    value: row.revenueCents,
                    detail: `${integer(row.lineItemCount)} lines • ${integer(row.jobCount)} jobs`,
                  }))}
                  valueLabel={(value) => money(value)}
                  color="rgba(96,165,250,0.95)"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className={S.cardInner} style={{ padding: 18 }}>
                <div className="text-sm font-medium text-[var(--text-primary)]">
                  Monthly recurring revenue
                </div>
                <div className="mt-1 text-xs text-[var(--text-muted)]">
                  Monthlyized from all active plans
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-serif), 'Instrument Serif', serif",
                    fontSize: 42,
                    lineHeight: 1,
                    color: "var(--accent-warm, #c9b89a)",
                    marginTop: 18,
                  }}
                >
                  {money(analytics.revenue.mrrCents)}
                </div>
              </div>

              <ListTable
                title="Top clients by revenue"
                subtitle="Best-performing accounts in the selected period"
                columns={["Client", "Invoices", "Revenue"]}
                empty="No client revenue data in this range."
                rows={analytics.clients.topByRevenue.map((row) => [
                  <span className="font-medium text-[var(--text-primary)]" key={`${row.name}-name`}>
                    {row.name}
                  </span>,
                  <span key={`${row.name}-count`}>{integer(row.invoiceCount)}</span>,
                  <span className="font-medium text-[var(--text-primary)]" key={`${row.name}-revenue`}>
                    {money(row.revenueCents)}
                  </span>,
                ])}
              />
            </div>
          </div>
        )}
      </SectionCard>

      <SectionCard
        eyebrow="Operations"
        title="Scheduling and completion"
        detail="Scheduled and completed jobs track against the selected date window. Overdue jobs remain a live operational backlog."
      >
        {loading || !analytics ? (
          <EmptyState message="Loading operations analytics…" />
        ) : (
          <div className="space-y-4">
            <LineChart
              title="Scheduled vs completed"
              subtitle="Warm line is scheduled volume, blue line is completed volume"
              primaryValues={operationsChart.scheduled}
              secondaryValues={operationsChart.completed}
              labels={operationsChart.labels}
              secondaryColor="#60a5fa"
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
              {[
                {
                  label: "Completion rate",
                  value: percent(analytics.operations.completionRate),
                  accent: true,
                },
                {
                  label: "Canceled jobs",
                  value: integer(analytics.operations.canceledJobs),
                },
                {
                  label: "Overdue jobs",
                  value: integer(analytics.operations.overdueJobs),
                },
                {
                  label: "Scheduled labor",
                  value: hours(analytics.operations.laborHoursScheduled),
                },
                {
                  label: "Completed labor",
                  value: hours(analytics.operations.laborHoursCompleted),
                },
              ].map((metric) => (
                <div key={metric.label} className={S.cardInner} style={{ padding: 16 }}>
                  <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    {metric.label}
                  </div>
                  <div
                    className="mt-2 text-2xl"
                    style={{
                      fontFamily: "var(--font-serif), 'Instrument Serif', serif",
                      color: metric.accent ? "var(--accent-warm, #c9b89a)" : "var(--text-primary)",
                    }}
                  >
                    {metric.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </SectionCard>

      <SectionCard
        eyebrow="Billing"
        title="Receivables and invoice status"
        detail="Outstanding and overdue balances are current-state billing metrics. Status counts reflect invoice activity in the selected period."
      >
        {loading || !analytics ? (
          <EmptyState message="Loading billing analytics…" />
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
                {[
                  ["Draft", analytics.billing.invoiceCounts.draft],
                  ["Sent", analytics.billing.invoiceCounts.sent],
                  ["Paid", analytics.billing.invoiceCounts.paid],
                  ["Overdue", analytics.billing.invoiceCounts.overdue],
                  ["Void", analytics.billing.invoiceCounts.void],
                  ["Total", analytics.billing.invoiceCounts.total],
                ].map(([label, value]) => (
                  <div key={label} className={S.cardInner} style={{ padding: 16 }}>
                    <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                      {label}
                    </div>
                    <div className="mt-2 text-xl font-medium text-[var(--text-primary)]">
                      {integer(Number(value))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className={S.cardInner} style={{ padding: 18 }}>
                  <div className="text-sm font-medium text-[var(--text-primary)]">
                    Outstanding balance
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-serif), 'Instrument Serif', serif",
                      fontSize: 34,
                      color: "var(--accent-warm, #c9b89a)",
                      marginTop: 14,
                    }}
                  >
                    {money(analytics.billing.outstandingCents)}
                  </div>
                  <div className="mt-2 text-xs text-[var(--text-secondary)]">
                    Current unpaid sent and overdue invoices
                  </div>
                </div>

                <div className={S.cardInner} style={{ padding: 18 }}>
                  <div className="text-sm font-medium text-[var(--text-primary)]">
                    Overdue balance
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-serif), 'Instrument Serif', serif",
                      fontSize: 34,
                      color: "#f87171",
                      marginTop: 14,
                    }}
                  >
                    {money(analytics.billing.overdueCents)}
                  </div>
                  <div className="mt-2 text-xs text-[var(--text-secondary)]">
                    {integer(analytics.billing.clientsWithOverdueInvoices)} clients currently overdue
                  </div>
                </div>
              </div>
            </div>

            <HorizontalBars
              title="Aging buckets"
              subtitle="Current unpaid invoices grouped by days from due date"
              rows={analytics.billing.agingBuckets.map((bucket) => ({
                label: bucket.label,
                value: bucket.amountCents,
                detail: `${integer(bucket.count)} invoices`,
              }))}
              valueLabel={(value) => money(value)}
              color="rgba(248,113,113,0.92)"
            />
          </div>
        )}
      </SectionCard>

      <SectionCard
        eyebrow="Clients"
        title="Client health and exceptions"
        detail="Highlights the accounts contributing the most revenue, current plan coverage, overdue exposure, and plan clients with no recent job activity."
      >
        {loading || !analytics ? (
          <EmptyState message="Loading client analytics…" />
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <ListTable
              title="Clients with active plans"
              subtitle="Top accounts by active recurring plan value"
              columns={["Client", "Plans", "MRR"]}
              empty="No active plans found."
              rows={analytics.clients.clientsWithActivePlans.map((row) => [
                <span className="font-medium text-[var(--text-primary)]" key={`${row.clientId}-name`}>
                  {row.clientName}
                </span>,
                <span key={`${row.clientId}-plans`}>{integer(row.planCount)}</span>,
                <span className="font-medium text-[var(--text-primary)]" key={`${row.clientId}-mrr`}>
                  {money(row.mrrCents)}
                </span>,
              ])}
            />

            <ListTable
              title="Clients with overdue invoices"
              subtitle="Accounts that need billing follow-up"
              columns={["Client", "Invoices", "Overdue"]}
              empty="No overdue client balances."
              rows={analytics.clients.clientsWithOverdueInvoices.map((row) => [
                <span className="font-medium text-[var(--text-primary)]" key={`${row.clientId}-name`}>
                  {row.clientName}
                </span>,
                <span key={`${row.clientId}-count`}>{integer(row.overdueInvoices)}</span>,
                <span className="font-medium text-[var(--text-primary)]" key={`${row.clientId}-amount`}>
                  {money(row.overdueAmountCents)}
                </span>,
              ])}
            />

            <ListTable
              title="Clients with no recent jobs"
              subtitle={`Active-plan clients without a visit since ${formatDate(
                analytics.range.noRecentJobsLookbackStart
              )}`}
              columns={["Client", "Plans", "Last job"]}
              empty="No active-plan clients are missing recent jobs."
              rows={analytics.clients.clientsWithNoRecentJobs.map((row) => [
                <span className="font-medium text-[var(--text-primary)]" key={`${row.clientId}-name`}>
                  {row.clientName}
                </span>,
                <span key={`${row.clientId}-plans`}>{integer(row.activePlanCount)}</span>,
                <span key={`${row.clientId}-lastJob`}>{formatDate(row.lastJobAt)}</span>,
              ])}
            />
          </div>
        )}
      </SectionCard>

      <SectionCard
        eyebrow="Orders"
        title="Order analytics"
        detail="Tracks paid order volume and fulfillment mix using the same portal order records and statuses already used by the operations team."
      >
        {loading || !analytics ? (
          <EmptyState message="Loading order analytics…" />
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.9fr)]">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className={S.cardInner} style={{ padding: 18 }}>
                  <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    Total orders
                  </div>
                  <div
                    className="mt-2 text-3xl"
                    style={{
                      fontFamily: "var(--font-serif), 'Instrument Serif', serif",
                      color: "var(--text-primary)",
                    }}
                  >
                    {integer(analytics.orders.totalOrders)}
                  </div>
                </div>
                <div className={S.cardInner} style={{ padding: 18 }}>
                  <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    Order revenue
                  </div>
                  <div
                    className="mt-2 text-3xl"
                    style={{
                      fontFamily: "var(--font-serif), 'Instrument Serif', serif",
                      color: "var(--accent-warm, #c9b89a)",
                    }}
                  >
                    {money(analytics.orders.revenueCents)}
                  </div>
                </div>
                <div className={S.cardInner} style={{ padding: 18 }}>
                  <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    Avg order value
                  </div>
                  <div
                    className="mt-2 text-3xl"
                    style={{
                      fontFamily: "var(--font-serif), 'Instrument Serif', serif",
                      color: "var(--text-primary)",
                    }}
                  >
                    {money(
                      analytics.orders.totalOrders > 0
                        ? Math.round(analytics.orders.revenueCents / analytics.orders.totalOrders)
                        : 0
                    )}
                  </div>
                </div>
              </div>

              <LineChart
                title="Order trend"
                subtitle="Order count by bucket in the selected range"
                primaryValues={ordersChart.values}
                labels={ordersChart.labels}
                primaryColor="#60a5fa"
              />
            </div>

            <div className="space-y-4">
              <div className={S.cardInner} style={{ padding: 18 }}>
                <div className="text-sm font-medium text-[var(--text-primary)]">
                  Fulfillment status breakdown
                </div>
                <div className="mt-1 text-xs text-[var(--text-muted)]">
                  Current order mix inside the selected period
                </div>

                <div className="mt-4 space-y-3">
                  {analytics.orders.statusBreakdown.length === 0 ? (
                    <div className="text-sm text-[var(--text-muted)]">No orders in this range.</div>
                  ) : (
                    analytics.orders.statusBreakdown.map((row) => (
                      <div
                        key={row.status}
                        className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3.5 py-3"
                      >
                        <div
                          className="rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.16em]"
                          style={statusTone(row.status)}
                        >
                          {row.status}
                        </div>
                        <div className="text-sm font-medium text-[var(--text-primary)]">
                          {integer(row.count)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <ListTable
                title="Range summary"
                subtitle="Quick order KPIs for this window"
                columns={["Metric", "Value"]}
                empty="No order data in this range."
                rows={[
                  ["Range", analytics.range.label],
                  ["Total orders", integer(analytics.orders.totalOrders)],
                  ["Revenue", money(analytics.orders.revenueCents)],
                ].map(([label, value]) => [
                  <span className="font-medium text-[var(--text-primary)]" key={String(label)}>
                    {label}
                  </span>,
                  <span key={`${label}-${value}`}>{value}</span>,
                ])}
              />
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
