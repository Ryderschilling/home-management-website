import { ensureAdminTables, sql } from "@/lib/server/db";

export type AnalyticsRangeKey = "30D" | "90D" | "12M" | "ALL";
type AnalyticsBucket = "day" | "week" | "month";

type TrendPoint = {
  key: string;
  label: string;
  revenueCents?: number;
  scheduledCount?: number;
  completedCount?: number;
  orderCount?: number;
  orderRevenueCents?: number;
};

type NamedMoneyRow = {
  clientId?: string | null;
  clientName?: string | null;
  serviceId?: string | null;
  name: string;
  revenueCents: number;
  invoiceCount?: number;
  jobCount?: number;
  lineItemCount?: number;
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

type ClientRevenueRow = Required<
  Pick<NamedMoneyRow, "name" | "revenueCents" | "invoiceCount">
> &
  Pick<NamedMoneyRow, "clientId" | "clientName">;

type ServiceRevenueRow = Required<
  Pick<NamedMoneyRow, "name" | "revenueCents" | "jobCount" | "lineItemCount">
> &
  Pick<NamedMoneyRow, "serviceId">;

export type AnalyticsPayload = {
  generatedAt: string;
  range: {
    key: AnalyticsRangeKey;
    label: string;
    since: string | null;
    until: string;
    bucket: AnalyticsBucket;
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
    trend: Array<TrendPoint & { revenueCents: number }>;
    byClient: ClientRevenueRow[];
    byService: ServiceRevenueRow[];
    mrrCents: number;
  };
  operations: {
    scheduledVsCompleted: Array<
      TrendPoint & { scheduledCount: number; completedCount: number }
    >;
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
    topByRevenue: Array<
      Required<Pick<NamedMoneyRow, "name" | "revenueCents" | "invoiceCount">> &
        Pick<NamedMoneyRow, "clientId" | "clientName">
    >;
    clientsWithActivePlans: ClientPlanRow[];
    clientsWithOverdueInvoices: ClientOverdueRow[];
    clientsWithNoRecentJobs: ClientNoRecentJobsRow[];
  };
  orders: {
    totalOrders: number;
    revenueCents: number;
    statusBreakdown: StatusBreakdownRow[];
    trend: Array<
      TrendPoint & { orderCount: number; orderRevenueCents: number }
    >;
  };
};

type RangeConfig = {
  label: string;
  bucket: AnalyticsBucket;
  since: Date | null;
};

function toUtcDateKey(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function startOfUtcWeek(date: Date) {
  const start = startOfUtcDay(date);
  const day = start.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setUTCDate(start.getUTCDate() + diff);
  return start;
}

function startOfUtcMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function addUtcDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function addUtcMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setUTCMonth(next.getUTCMonth() + months);
  return next;
}

function formatBucketLabel(bucket: AnalyticsBucket, key: string) {
  const date = new Date(`${key}T00:00:00.000Z`);
  if (bucket === "day") {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  }

  if (bucket === "week") {
    const end = addUtcDays(date, 6);
    return `${date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    })} - ${end.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    })}`;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function parseBucketKey(value: unknown) {
  const raw = String(value ?? "").slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null;
}

function asNumber(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function asInteger(value: unknown) {
  return Math.round(asNumber(value));
}

function asNullableString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function asIsoString(value: unknown) {
  if (typeof value === "string" && value.trim()) return value;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString();
  return null;
}

function resolveRange(key: string | null | undefined): {
  key: AnalyticsRangeKey;
  label: string;
  bucket: AnalyticsBucket;
  since: Date | null;
  until: Date;
  noRecentJobsLookbackStart: Date;
} {
  const normalized = String(key ?? "30D").toUpperCase() as AnalyticsRangeKey;
  const now = new Date();
  const today = startOfUtcDay(now);

  const configByKey: Record<AnalyticsRangeKey, RangeConfig> = {
    "30D": {
      label: "Last 30 days",
      bucket: "day",
      since: addUtcDays(today, -29),
    },
    "90D": {
      label: "Last 90 days",
      bucket: "week",
      since: addUtcDays(today, -89),
    },
    "12M": {
      label: "Last 12 months",
      bucket: "month",
      since: startOfUtcMonth(addUtcMonths(today, -11)),
    },
    ALL: {
      label: "All time",
      bucket: "month",
      since: null,
    },
  };

  const selected = configByKey[normalized] ?? configByKey["30D"];
  return {
    key: normalized in configByKey ? normalized : "30D",
    label: selected.label,
    bucket: selected.bucket,
    since: selected.since,
    until: now,
    noRecentJobsLookbackStart: selected.since ?? addUtcDays(today, -89),
  };
}

function makeBucketKeys(
  since: Date | null,
  until: Date,
  bucket: AnalyticsBucket,
  fallbackKeys: string[] = []
) {
  if (!since) {
    return [...new Set(fallbackKeys)].sort((left, right) => left.localeCompare(right));
  }

  const keys: string[] = [];
  let cursor =
    bucket === "day"
      ? startOfUtcDay(since)
      : bucket === "week"
        ? startOfUtcWeek(since)
        : startOfUtcMonth(since);
  const limit = startOfUtcDay(until);

  while (cursor <= limit) {
    keys.push(toUtcDateKey(cursor));
    cursor =
      bucket === "day"
        ? addUtcDays(cursor, 1)
        : bucket === "week"
          ? addUtcDays(cursor, 7)
          : addUtcMonths(cursor, 1);
  }

  return keys;
}

function mapTrendSeries(
  bucket: AnalyticsBucket,
  keys: string[],
  valueMap: Map<string, number>,
  field: "revenueCents" | "scheduledCount" | "completedCount" | "orderCount" | "orderRevenueCents"
) {
  return keys.map((key) => ({
    key,
    label: formatBucketLabel(bucket, key),
    [field]: valueMap.get(key) ?? 0,
  })) as Array<
    TrendPoint & {
      revenueCents?: number;
      scheduledCount?: number;
      completedCount?: number;
      orderCount?: number;
      orderRevenueCents?: number;
    }
  >;
}

function mergeOperationSeries(
  bucket: AnalyticsBucket,
  keys: string[],
  scheduledMap: Map<string, number>,
  completedMap: Map<string, number>
) {
  return keys.map((key) => ({
    key,
    label: formatBucketLabel(bucket, key),
    scheduledCount: scheduledMap.get(key) ?? 0,
    completedCount: completedMap.get(key) ?? 0,
  }));
}

function sumMrrCents(rows: Array<{ amount_cents: unknown; billing_frequency: unknown; billing_interval: unknown }>) {
  return Math.round(
    rows.reduce((sum, row) => {
      const amount = asNumber(row.amount_cents);
      const interval = Math.max(1, asNumber(row.billing_interval));
      const frequency = String(row.billing_frequency ?? "").toUpperCase();

      if (frequency === "DAILY") return sum + amount * (365.25 / 12 / interval);
      if (frequency === "WEEKLY") return sum + amount * (52 / 12 / interval);
      return sum + amount / interval;
    }, 0)
  );
}

export async function getAnalytics(
  organizationId: string,
  rangeKey?: string | null
): Promise<AnalyticsPayload> {
  await ensureAdminTables();

  const range = resolveRange(rangeKey);
  const since = range.since;
  const until = range.until;
  const noRecentJobsLookbackStart = range.noRecentJobsLookbackStart;

  const revenueStatuses = ["SENT", "PAID", "OVERDUE"];
  const unpaidStatuses = ["SENT", "OVERDUE"];

  const [
    kpiRows,
    activeClientRows,
    revenueTrendRows,
    revenueByClientRows,
    revenueByServiceRows,
    activeRetainerRows,
    scheduledTrendRows,
    completedTrendRows,
    operationsSummaryRows,
    invoiceStatusRows,
    billingSummaryRows,
    overdueClientRows,
    activePlanClientRows,
    noRecentJobClientRows,
    orderSummaryRows,
    orderStatusRows,
    orderTrendRows,
  ] = await Promise.all([
    sql`
      SELECT
        COALESCE((
          SELECT SUM(i.total_cents)
          FROM admin_invoices i
          WHERE i.organization_id = ${organizationId}
            AND UPPER(i.status) = ANY(${sql.array(revenueStatuses)})
            ${since ? sql`AND COALESCE(i.issue_date::timestamp, i.created_at) >= ${since}` : sql``}
            AND COALESCE(i.issue_date::timestamp, i.created_at) <= ${until}
        ), 0) AS revenue_cents,
        COALESCE((
          SELECT SUM(i.total_cents)
          FROM admin_invoices i
          WHERE i.organization_id = ${organizationId}
            AND UPPER(i.status) = ANY(${sql.array(unpaidStatuses)})
        ), 0) AS outstanding_invoice_cents,
        COALESCE((
          SELECT COUNT(*)::int
          FROM admin_retainers r
          WHERE r.organization_id = ${organizationId}
            AND UPPER(r.status) = 'ACTIVE'
        ), 0) AS active_plans,
        COALESCE((
          SELECT COUNT(*)::int
          FROM admin_jobs j
          WHERE j.organization_id = ${organizationId}
            ${since ? sql`AND j.scheduled_for >= ${since}` : sql``}
            AND j.scheduled_for <= ${until}
        ), 0) AS jobs_scheduled,
        COALESCE((
          SELECT COUNT(*)::int
          FROM admin_jobs j
          WHERE j.organization_id = ${organizationId}
            AND UPPER(j.status) = 'COMPLETED'
            ${since ? sql`AND COALESCE(j.completed_at, j.scheduled_for) >= ${since}` : sql``}
            AND COALESCE(j.completed_at, j.scheduled_for) <= ${until}
        ), 0) AS jobs_completed
    `,
    sql`
      WITH active_client_ids AS (
        SELECT r.client_id AS client_id
        FROM admin_retainers r
        WHERE r.organization_id = ${organizationId}
          AND UPPER(r.status) = 'ACTIVE'
          AND r.client_id IS NOT NULL
        UNION
        SELECT j.client_id AS client_id
        FROM admin_jobs j
        WHERE j.organization_id = ${organizationId}
          AND j.client_id IS NOT NULL
          ${since ? sql`AND j.scheduled_for >= ${since}` : sql``}
          AND j.scheduled_for <= ${until}
        UNION
        SELECT i.client_id AS client_id
        FROM admin_invoices i
        WHERE i.organization_id = ${organizationId}
          AND i.client_id IS NOT NULL
          ${since ? sql`AND COALESCE(i.issue_date::timestamp, i.created_at) >= ${since}` : sql``}
          AND COALESCE(i.issue_date::timestamp, i.created_at) <= ${until}
          AND UPPER(i.status) <> 'VOID'
        UNION
        SELECT o.client_id AS client_id
        FROM admin_orders o
        WHERE o.organization_id = ${organizationId}
          AND o.client_id IS NOT NULL
          ${since ? sql`AND o.created_at >= ${since}` : sql``}
          AND o.created_at <= ${until}
      )
      SELECT COUNT(DISTINCT client_id)::int AS active_clients
      FROM active_client_ids
    `,
    sql`
      SELECT
        DATE_TRUNC(${range.bucket}, COALESCE(i.issue_date::timestamp, i.created_at))::date AS bucket_start,
        COALESCE(SUM(i.total_cents), 0) AS revenue_cents
      FROM admin_invoices i
      WHERE i.organization_id = ${organizationId}
        AND UPPER(i.status) = ANY(${sql.array(revenueStatuses)})
        ${since ? sql`AND COALESCE(i.issue_date::timestamp, i.created_at) >= ${since}` : sql``}
        AND COALESCE(i.issue_date::timestamp, i.created_at) <= ${until}
      GROUP BY 1
      ORDER BY 1
    `,
    sql`
      SELECT
        c.id AS client_id,
        COALESCE(c.name, 'Unassigned client') AS client_name,
        COUNT(i.id)::int AS invoice_count,
        COALESCE(SUM(i.total_cents), 0) AS revenue_cents
      FROM admin_invoices i
      LEFT JOIN admin_clients c
        ON c.id = i.client_id
        AND c.organization_id = i.organization_id
      WHERE i.organization_id = ${organizationId}
        AND UPPER(i.status) = ANY(${sql.array(revenueStatuses)})
        ${since ? sql`AND COALESCE(i.issue_date::timestamp, i.created_at) >= ${since}` : sql``}
        AND COALESCE(i.issue_date::timestamp, i.created_at) <= ${until}
      GROUP BY c.id, c.name
      ORDER BY revenue_cents DESC, client_name ASC
      LIMIT 8
    `,
    sql`
      SELECT
        s.id AS service_id,
        COALESCE(
          s.name,
          CASE
            WHEN li.line_type = 'PLAN_BASE' THEN 'Plan base billing'
            WHEN li.line_type = 'JOB_EXTRA' THEN 'Unmapped job work'
            ELSE 'Manual invoice items'
          END
        ) AS name,
        COUNT(li.id)::int AS line_item_count,
        COUNT(DISTINCT li.job_id)::int AS job_count,
        COALESCE(SUM(li.line_total_cents), 0) AS revenue_cents
      FROM admin_invoice_line_items li
      JOIN admin_invoices i
        ON i.id = li.invoice_id
        AND i.organization_id = li.organization_id
      LEFT JOIN admin_jobs j
        ON j.id = li.job_id
        AND j.organization_id = li.organization_id
      LEFT JOIN admin_services s
        ON s.id = j.service_id
        AND s.organization_id = li.organization_id
      WHERE li.organization_id = ${organizationId}
        AND UPPER(i.status) = ANY(${sql.array(revenueStatuses)})
        ${since ? sql`AND COALESCE(i.issue_date::timestamp, i.created_at) >= ${since}` : sql``}
        AND COALESCE(i.issue_date::timestamp, i.created_at) <= ${until}
      GROUP BY s.id, name, li.line_type
      ORDER BY revenue_cents DESC, name ASC
      LIMIT 8
    `,
    sql`
      SELECT amount_cents, billing_frequency, billing_interval
      FROM admin_retainers
      WHERE organization_id = ${organizationId}
        AND UPPER(status) = 'ACTIVE'
    `,
    sql`
      SELECT
        DATE_TRUNC(${range.bucket}, j.scheduled_for)::date AS bucket_start,
        COUNT(*)::int AS scheduled_count
      FROM admin_jobs j
      WHERE j.organization_id = ${organizationId}
        ${since ? sql`AND j.scheduled_for >= ${since}` : sql``}
        AND j.scheduled_for <= ${until}
      GROUP BY 1
      ORDER BY 1
    `,
    sql`
      SELECT
        DATE_TRUNC(${range.bucket}, COALESCE(j.completed_at, j.scheduled_for))::date AS bucket_start,
        COUNT(*)::int AS completed_count
      FROM admin_jobs j
      WHERE j.organization_id = ${organizationId}
        AND UPPER(j.status) = 'COMPLETED'
        ${since ? sql`AND COALESCE(j.completed_at, j.scheduled_for) >= ${since}` : sql``}
        AND COALESCE(j.completed_at, j.scheduled_for) <= ${until}
      GROUP BY 1
      ORDER BY 1
    `,
    sql`
      SELECT
        COALESCE((
          SELECT COUNT(*)::int
          FROM admin_jobs j
          WHERE j.organization_id = ${organizationId}
            AND UPPER(j.status) = 'CANCELED'
            ${since ? sql`AND j.scheduled_for >= ${since}` : sql``}
            AND j.scheduled_for <= ${until}
        ), 0) AS canceled_jobs,
        COALESCE((
          SELECT COUNT(*)::int
          FROM admin_jobs j
          WHERE j.organization_id = ${organizationId}
            AND UPPER(j.status) NOT IN ('COMPLETED', 'CANCELED')
            AND j.scheduled_for < NOW()
        ), 0) AS overdue_jobs,
        COALESCE((
          SELECT SUM(
            COALESCE(
              NULLIF(j.hours_numeric::text, '')::numeric,
              CASE
                WHEN j.duration_minutes IS NOT NULL THEN j.duration_minutes / 60.0
                ELSE 0
              END
            )
          )
          FROM admin_jobs j
          WHERE j.organization_id = ${organizationId}
            ${since ? sql`AND j.scheduled_for >= ${since}` : sql``}
            AND j.scheduled_for <= ${until}
        ), 0) AS labor_hours_scheduled,
        COALESCE((
          SELECT SUM(
            COALESCE(
              NULLIF(j.hours_numeric::text, '')::numeric,
              CASE
                WHEN j.duration_minutes IS NOT NULL THEN j.duration_minutes / 60.0
                ELSE 0
              END
            )
          )
          FROM admin_jobs j
          WHERE j.organization_id = ${organizationId}
            AND UPPER(j.status) = 'COMPLETED'
            ${since ? sql`AND COALESCE(j.completed_at, j.scheduled_for) >= ${since}` : sql``}
            AND COALESCE(j.completed_at, j.scheduled_for) <= ${until}
        ), 0) AS labor_hours_completed
    `,
    sql`
      SELECT
        UPPER(i.status) AS status,
        COUNT(*)::int AS count
      FROM admin_invoices i
      WHERE i.organization_id = ${organizationId}
        ${since ? sql`AND COALESCE(i.issue_date::timestamp, i.created_at) >= ${since}` : sql``}
        AND COALESCE(i.issue_date::timestamp, i.created_at) <= ${until}
      GROUP BY 1
      ORDER BY 1
    `,
    sql`
      SELECT
        COALESCE(SUM(CASE
          WHEN UPPER(i.status) = ANY(${sql.array(unpaidStatuses)})
          THEN i.total_cents
          ELSE 0
        END), 0) AS outstanding_cents,
        COALESCE(SUM(CASE
          WHEN UPPER(i.status) = ANY(${sql.array(unpaidStatuses)})
            AND (
              UPPER(i.status) = 'OVERDUE'
              OR (i.due_date IS NOT NULL AND i.due_date < CURRENT_DATE)
            )
          THEN i.total_cents
          ELSE 0
        END), 0) AS overdue_cents,
        COUNT(DISTINCT CASE
          WHEN UPPER(i.status) = ANY(${sql.array(unpaidStatuses)})
            AND (
              UPPER(i.status) = 'OVERDUE'
              OR (i.due_date IS NOT NULL AND i.due_date < CURRENT_DATE)
            )
          THEN i.client_id
          ELSE NULL
        END)::int AS clients_with_overdue_invoices,
        COUNT(*) FILTER (
          WHERE UPPER(i.status) = ANY(${sql.array(unpaidStatuses)})
            AND GREATEST(CURRENT_DATE - COALESCE(i.due_date, CURRENT_DATE), 0) BETWEEN 0 AND 7
        )::int AS aging_0_7_count,
        COALESCE(SUM(CASE
          WHEN UPPER(i.status) = ANY(${sql.array(unpaidStatuses)})
            AND GREATEST(CURRENT_DATE - COALESCE(i.due_date, CURRENT_DATE), 0) BETWEEN 0 AND 7
          THEN i.total_cents
          ELSE 0
        END), 0) AS aging_0_7_amount,
        COUNT(*) FILTER (
          WHERE UPPER(i.status) = ANY(${sql.array(unpaidStatuses)})
            AND GREATEST(CURRENT_DATE - COALESCE(i.due_date, CURRENT_DATE), 0) BETWEEN 8 AND 30
        )::int AS aging_8_30_count,
        COALESCE(SUM(CASE
          WHEN UPPER(i.status) = ANY(${sql.array(unpaidStatuses)})
            AND GREATEST(CURRENT_DATE - COALESCE(i.due_date, CURRENT_DATE), 0) BETWEEN 8 AND 30
          THEN i.total_cents
          ELSE 0
        END), 0) AS aging_8_30_amount,
        COUNT(*) FILTER (
          WHERE UPPER(i.status) = ANY(${sql.array(unpaidStatuses)})
            AND GREATEST(CURRENT_DATE - COALESCE(i.due_date, CURRENT_DATE), 0) >= 31
        )::int AS aging_31_plus_count,
        COALESCE(SUM(CASE
          WHEN UPPER(i.status) = ANY(${sql.array(unpaidStatuses)})
            AND GREATEST(CURRENT_DATE - COALESCE(i.due_date, CURRENT_DATE), 0) >= 31
          THEN i.total_cents
          ELSE 0
        END), 0) AS aging_31_plus_amount
      FROM admin_invoices i
      WHERE i.organization_id = ${organizationId}
    `,
    sql`
      SELECT
        c.id AS client_id,
        COALESCE(c.name, 'Unassigned client') AS client_name,
        COUNT(*)::int AS overdue_invoices,
        COALESCE(SUM(i.total_cents), 0) AS overdue_amount_cents
      FROM admin_invoices i
      LEFT JOIN admin_clients c
        ON c.id = i.client_id
        AND c.organization_id = i.organization_id
      WHERE i.organization_id = ${organizationId}
        AND UPPER(i.status) = ANY(${sql.array(unpaidStatuses)})
        AND (
          UPPER(i.status) = 'OVERDUE'
          OR (i.due_date IS NOT NULL AND i.due_date < CURRENT_DATE)
        )
      GROUP BY c.id, c.name
      ORDER BY overdue_amount_cents DESC, client_name ASC
      LIMIT 8
    `,
    sql`
      SELECT
        c.id AS client_id,
        COALESCE(c.name, 'Unassigned client') AS client_name,
        COUNT(r.id)::int AS plan_count,
        COALESCE(SUM(
          CASE
            WHEN UPPER(r.billing_frequency) = 'DAILY' THEN r.amount_cents * (365.25 / 12 / GREATEST(r.billing_interval, 1))
            WHEN UPPER(r.billing_frequency) = 'WEEKLY' THEN r.amount_cents * (52 / 12 / GREATEST(r.billing_interval, 1))
            ELSE r.amount_cents / GREATEST(r.billing_interval, 1)
          END
        ), 0) AS mrr_cents
      FROM admin_retainers r
      LEFT JOIN admin_clients c
        ON c.id = r.client_id
        AND c.organization_id = r.organization_id
      WHERE r.organization_id = ${organizationId}
        AND UPPER(r.status) = 'ACTIVE'
      GROUP BY c.id, c.name
      ORDER BY mrr_cents DESC, client_name ASC
      LIMIT 8
    `,
    sql`
      SELECT
        c.id AS client_id,
        COALESCE(c.name, 'Unassigned client') AS client_name,
        plan_summary.active_plan_count,
        last_job.last_job_at
      FROM admin_clients c
      JOIN LATERAL (
        SELECT COUNT(*)::int AS active_plan_count
        FROM admin_retainers r
        WHERE r.organization_id = c.organization_id
          AND r.client_id = c.id
          AND UPPER(r.status) = 'ACTIVE'
      ) AS plan_summary ON true
      LEFT JOIN LATERAL (
        SELECT MAX(j.scheduled_for) AS last_job_at
        FROM admin_jobs j
        WHERE j.organization_id = c.organization_id
          AND j.client_id = c.id
          AND UPPER(j.status) <> 'CANCELED'
      ) AS last_job ON true
      WHERE c.organization_id = ${organizationId}
        AND plan_summary.active_plan_count > 0
        AND (
          last_job.last_job_at IS NULL
          OR last_job.last_job_at < ${noRecentJobsLookbackStart}
        )
      ORDER BY last_job.last_job_at ASC NULLS FIRST, client_name ASC
      LIMIT 8
    `,
    sql`
      SELECT
        COUNT(*)::int AS total_orders,
        COALESCE(SUM(o.total_amount_cents), 0) AS revenue_cents
      FROM admin_orders o
      WHERE o.organization_id = ${organizationId}
        ${since ? sql`AND o.created_at >= ${since}` : sql``}
        AND o.created_at <= ${until}
    `,
    sql`
      SELECT
        COALESCE(NULLIF(UPPER(o.fulfillment_status), ''), 'NEW') AS status,
        COUNT(*)::int AS count
      FROM admin_orders o
      WHERE o.organization_id = ${organizationId}
        ${since ? sql`AND o.created_at >= ${since}` : sql``}
        AND o.created_at <= ${until}
      GROUP BY 1
      ORDER BY count DESC, status ASC
    `,
    sql`
      SELECT
        DATE_TRUNC(${range.bucket}, o.created_at)::date AS bucket_start,
        COUNT(*)::int AS order_count,
        COALESCE(SUM(o.total_amount_cents), 0) AS order_revenue_cents
      FROM admin_orders o
      WHERE o.organization_id = ${organizationId}
        ${since ? sql`AND o.created_at >= ${since}` : sql``}
        AND o.created_at <= ${until}
      GROUP BY 1
      ORDER BY 1
    `,
  ]);

  const kpis = kpiRows[0] ?? {};
  const activeClients = activeClientRows[0] ?? {};
  const billingSummary = billingSummaryRows[0] ?? {};
  const operationsSummary = operationsSummaryRows[0] ?? {};
  const orderSummary = orderSummaryRows[0] ?? {};

  const invoiceCounts = {
    total: 0,
    draft: 0,
    sent: 0,
    paid: 0,
    overdue: 0,
    void: 0,
  };

  for (const row of invoiceStatusRows) {
    const status = String(row.status ?? "").toUpperCase();
    const count = asInteger(row.count);
    invoiceCounts.total += count;
    if (status === "DRAFT") invoiceCounts.draft = count;
    if (status === "SENT") invoiceCounts.sent = count;
    if (status === "PAID") invoiceCounts.paid = count;
    if (status === "OVERDUE") invoiceCounts.overdue = count;
    if (status === "VOID") invoiceCounts.void = count;
  }

  const revenueTrendMap = new Map<string, number>();
  for (const row of revenueTrendRows) {
    const key = parseBucketKey(row.bucket_start);
    if (!key) continue;
    revenueTrendMap.set(key, asInteger(row.revenue_cents));
  }

  const scheduledMap = new Map<string, number>();
  for (const row of scheduledTrendRows) {
    const key = parseBucketKey(row.bucket_start);
    if (!key) continue;
    scheduledMap.set(key, asInteger(row.scheduled_count));
  }

  const completedMap = new Map<string, number>();
  for (const row of completedTrendRows) {
    const key = parseBucketKey(row.bucket_start);
    if (!key) continue;
    completedMap.set(key, asInteger(row.completed_count));
  }

  const orderCountMap = new Map<string, number>();
  const orderRevenueMap = new Map<string, number>();
  for (const row of orderTrendRows) {
    const key = parseBucketKey(row.bucket_start);
    if (!key) continue;
    orderCountMap.set(key, asInteger(row.order_count));
    orderRevenueMap.set(key, asInteger(row.order_revenue_cents));
  }

  const revenueKeys = makeBucketKeys(
    since,
    until,
    range.bucket,
    Array.from(revenueTrendMap.keys())
  );
  const operationKeys = makeBucketKeys(since, until, range.bucket, [
    ...Array.from(scheduledMap.keys()),
    ...Array.from(completedMap.keys()),
  ]);
  const orderKeys = makeBucketKeys(since, until, range.bucket, Array.from(orderCountMap.keys()));

  const revenueTrend = mapTrendSeries(
    range.bucket,
    revenueKeys,
    revenueTrendMap,
    "revenueCents"
  ).map((point) => ({
    key: point.key,
    label: point.label,
    revenueCents: point.revenueCents ?? 0,
  }));

  const scheduledVsCompleted = mergeOperationSeries(
    range.bucket,
    operationKeys,
    scheduledMap,
    completedMap
  );

  const orderTrend = orderKeys.map((key) => ({
    key,
    label: formatBucketLabel(range.bucket, key),
    orderCount: orderCountMap.get(key) ?? 0,
    orderRevenueCents: orderRevenueMap.get(key) ?? 0,
  }));

  const topClientRows = revenueByClientRows.map((row) => ({
    clientId: asNullableString(row.client_id),
    clientName: asNullableString(row.client_name),
    name: String(row.client_name ?? "Unassigned client"),
    revenueCents: asInteger(row.revenue_cents),
    invoiceCount: asInteger(row.invoice_count),
  }));

  return {
    generatedAt: new Date().toISOString(),
    range: {
      key: range.key,
      label: range.label,
      since: since ? since.toISOString() : null,
      until: until.toISOString(),
      bucket: range.bucket,
      noRecentJobsLookbackStart: noRecentJobsLookbackStart.toISOString(),
    },
    kpis: {
      revenueCents: asInteger(kpis.revenue_cents),
      outstandingInvoiceCents: asInteger(kpis.outstanding_invoice_cents),
      activePlans: asInteger(kpis.active_plans),
      jobsScheduled: asInteger(kpis.jobs_scheduled),
      jobsCompleted: asInteger(kpis.jobs_completed),
      activeClients: asInteger(activeClients.active_clients),
    },
    revenue: {
      trend: revenueTrend,
      byClient: topClientRows,
      byService: revenueByServiceRows.map((row) => ({
        serviceId: asNullableString(row.service_id),
        name: String(row.name ?? "Unassigned service"),
        revenueCents: asInteger(row.revenue_cents),
        jobCount: asInteger(row.job_count),
        lineItemCount: asInteger(row.line_item_count),
      })),
      mrrCents: sumMrrCents(
        activeRetainerRows.map((row) => ({
          amount_cents: row.amount_cents,
          billing_frequency: row.billing_frequency,
          billing_interval: row.billing_interval,
        }))
      ),
    },
    operations: {
      scheduledVsCompleted,
      completionRate:
        asInteger(kpis.jobs_scheduled) > 0
          ? asNumber(kpis.jobs_completed) / asNumber(kpis.jobs_scheduled)
          : 0,
      canceledJobs: asInteger(operationsSummary.canceled_jobs),
      overdueJobs: asInteger(operationsSummary.overdue_jobs),
      laborHoursScheduled: Number(asNumber(operationsSummary.labor_hours_scheduled).toFixed(1)),
      laborHoursCompleted: Number(asNumber(operationsSummary.labor_hours_completed).toFixed(1)),
    },
    billing: {
      invoiceCounts,
      outstandingCents: asInteger(billingSummary.outstanding_cents),
      overdueCents: asInteger(billingSummary.overdue_cents),
      agingBuckets: [
        {
          label: "0-7 days",
          count: asInteger(billingSummary.aging_0_7_count),
          amountCents: asInteger(billingSummary.aging_0_7_amount),
        },
        {
          label: "8-30 days",
          count: asInteger(billingSummary.aging_8_30_count),
          amountCents: asInteger(billingSummary.aging_8_30_amount),
        },
        {
          label: "31+ days",
          count: asInteger(billingSummary.aging_31_plus_count),
          amountCents: asInteger(billingSummary.aging_31_plus_amount),
        },
      ],
      clientsWithOverdueInvoices: asInteger(
        billingSummary.clients_with_overdue_invoices
      ),
    },
    clients: {
      topByRevenue: topClientRows,
      clientsWithActivePlans: activePlanClientRows.map((row) => ({
        clientId: String(row.client_id ?? ""),
        clientName: String(row.client_name ?? "Unassigned client"),
        planCount: asInteger(row.plan_count),
        mrrCents: asInteger(row.mrr_cents),
      })),
      clientsWithOverdueInvoices: overdueClientRows.map((row) => ({
        clientId: String(row.client_id ?? ""),
        clientName: String(row.client_name ?? "Unassigned client"),
        overdueInvoices: asInteger(row.overdue_invoices),
        overdueAmountCents: asInteger(row.overdue_amount_cents),
      })),
      clientsWithNoRecentJobs: noRecentJobClientRows.map((row) => ({
        clientId: String(row.client_id ?? ""),
        clientName: String(row.client_name ?? "Unassigned client"),
        activePlanCount: asInteger(row.active_plan_count),
        lastJobAt: asIsoString(row.last_job_at),
      })),
    },
    orders: {
      totalOrders: asInteger(orderSummary.total_orders),
      revenueCents: asInteger(orderSummary.revenue_cents),
      statusBreakdown: orderStatusRows.map((row) => ({
        status: String(row.status ?? "NEW"),
        count: asInteger(row.count),
      })),
      trend: orderTrend,
    },
  };
}
