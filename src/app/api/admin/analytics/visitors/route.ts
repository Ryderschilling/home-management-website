import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/server/auth";
import { fail, ok } from "@/lib/server/api";

export const runtime = "nodejs";

const PH_HOST = process.env.POSTHOG_HOST ?? "https://us.i.posthog.com";
const PH_PROJECT_ID = process.env.POSTHOG_PROJECT_ID ?? "";
const PH_PERSONAL_KEY = process.env.POSTHOG_PERSONAL_API_KEY ?? "";

type HogQLResult = {
  results: unknown[][];
  columns: string[];
  error?: string;
};

async function hogql(query: string): Promise<HogQLResult> {
  const res = await fetch(
    `${PH_HOST}/api/projects/${PH_PROJECT_ID}/query`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PH_PERSONAL_KEY}`,
      },
      body: JSON.stringify({ query: { kind: "HogQLQuery", query } }),
      // @ts-expect-error — Next.js fetch cache option
      next: { revalidate: 300 },
    }
  );
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`PostHog query failed (${res.status}): ${text.slice(0, 300)}`);
  }
  return res.json();
}

function rows(result: HogQLResult) {
  return result.results ?? [];
}

function sinceInterval(range: string) {
  switch (range) {
    case "7D":  return "interval 7 day";
    case "90D": return "interval 90 day";
    case "12M": return "interval 12 month";
    default:    return "interval 30 day";
  }
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json(fail("UNAUTHORIZED", "Admin authentication required."), { status: 401 });
  }

  if (!PH_PROJECT_ID || !PH_PERSONAL_KEY) {
    return NextResponse.json(ok({ configured: false }));
  }

  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") ?? "30D";
  const interval = sinceInterval(range);

  try {
    // Run all queries in parallel
    const [dailyResult, topPagesResult, funnelResult, referrersResult, kpiResult] =
      await Promise.all([

        // Daily unique visitors + pageviews
        // uniq() = ClickHouse approximate distinct count
        hogql(`
          SELECT
            toDate(timestamp) AS day,
            uniq(distinct_id) AS unique_visitors,
            count() AS pageviews
          FROM events
          WHERE event = '$pageview'
            AND timestamp >= now() - ${interval}
          GROUP BY day
          ORDER BY day ASC
        `),

        // Top pages by unique visitors
        hogql(`
          SELECT
            properties.$pathname AS page,
            uniq(distinct_id) AS unique_visitors,
            count() AS pageviews
          FROM events
          WHERE event = '$pageview'
            AND timestamp >= now() - ${interval}
            AND properties.$pathname IS NOT NULL
          GROUP BY page
          ORDER BY unique_visitors DESC
          LIMIT 10
        `),

        // Funnel: count unique visitors at each conversion step separately
        // We query each step independently to keep HogQL simple and reliable
        hogql(`
          SELECT
            uniqIf(distinct_id, event = '$pageview') AS step1_all,
            uniqIf(distinct_id,
              event = '$pageview' AND (
                properties.$pathname LIKE '%rock%'
                OR properties.$pathname LIKE '%service%'
                OR properties.$pathname LIKE '%pricing%'
                OR properties.$pathname LIKE '%concierge%'
                OR properties.$pathname LIKE '%home-check%'
                OR properties.$pathname LIKE '%second-home%'
                OR properties.$pathname LIKE '%property-care%'
                OR properties.$pathname LIKE '%mail%'
                OR properties.$pathname LIKE '%qr%'
              )
            ) AS step2_service,
            uniqIf(distinct_id,
              event = '$pageview' AND properties.$pathname LIKE '%qr%'
            ) AS step3_lead_form,
            uniqIf(distinct_id,
              event IN ('chm_lead_submitted', 'lead_submitted', 'qr_checkout_started')
            ) AS step4_converted
          FROM events
          WHERE timestamp >= now() - ${interval}
        `),

        // Traffic sources — bucket referrer into readable labels
        hogql(`
          SELECT
            multiIf(
              properties.$referring_domain IS NULL OR properties.$referring_domain = '',
              'Direct / None',
              properties.$referring_domain LIKE '%google%', 'Google',
              properties.$referring_domain LIKE '%facebook%' OR properties.$referring_domain LIKE '%fb.com%', 'Facebook',
              properties.$referring_domain LIKE '%instagram%', 'Instagram',
              properties.$referring_domain LIKE '%bing%', 'Bing',
              properties.$referring_domain LIKE '%claude%' OR properties.$referring_domain LIKE '%anthropic%', 'Claude AI',
              properties.$referring_domain LIKE '%chatgpt%' OR properties.$referring_domain LIKE '%openai%', 'ChatGPT',
              properties.$referring_domain
            ) AS source,
            uniq(distinct_id) AS visitors
          FROM events
          WHERE event = '$pageview'
            AND timestamp >= now() - ${interval}
          GROUP BY source
          ORDER BY visitors DESC
          LIMIT 8
        `),

        // KPIs
        hogql(`
          SELECT
            uniq(distinct_id) AS unique_visitors,
            count() AS total_pageviews,
            uniqIf(distinct_id, event = '$pageview' AND toDate(timestamp) = today()) AS visitors_today
          FROM events
          WHERE timestamp >= now() - ${interval}
        `),
      ]);

    // ── Shape results ────────────────────────────────────────────────────────

    const daily = rows(dailyResult).map((r) => ({
      day: String(r[0]),
      uniqueVisitors: Number(r[1]) || 0,
      pageviews: Number(r[2]) || 0,
    }));

    const topPages = rows(topPagesResult).map((r) => ({
      page: String(r[0] || "/"),
      uniqueVisitors: Number(r[1]) || 0,
      pageviews: Number(r[2]) || 0,
    }));

    const fRow = rows(funnelResult)[0] ?? [0, 0, 0, 0];
    const step1 = Number(fRow[0]) || 0;
    const step2 = Number(fRow[1]) || 0;
    const step3 = Number(fRow[2]) || 0;
    const step4 = Number(fRow[3]) || 0;
    const funnel = [
      { label: "All Visitors",       count: step1, pct: 100 },
      { label: "Viewed Service Page", count: step2, pct: step1 ? Math.round((step2 / step1) * 100) : 0 },
      { label: "Hit Lead Form",       count: step3, pct: step1 ? Math.round((step3 / step1) * 100) : 0 },
      { label: "Converted",           count: step4, pct: step1 ? Math.round((step4 / step1) * 100) : 0 },
    ];

    const referrers = rows(referrersResult).map((r) => ({
      source: String(r[0] || "Direct"),
      visitors: Number(r[1]) || 0,
    }));

    const kRow = rows(kpiResult)[0] ?? [0, 0, 0];
    const dayCount = range === "7D" ? 7 : range === "90D" ? 90 : range === "12M" ? 365 : 30;
    const kpis = {
      uniqueVisitors:    Number(kRow[0]) || 0,
      totalPageviews:    Number(kRow[1]) || 0,
      visitorsToday:     Number(kRow[2]) || 0,
      avgDailyPageviews: Math.round((Number(kRow[1]) || 0) / dayCount),
    };

    return NextResponse.json(
      ok({ configured: true, range, kpis, daily, topPages, funnel, referrers })
    );
  } catch (error) {
    return NextResponse.json(
      fail(
        "ANALYTICS_FETCH_FAILED",
        error instanceof Error ? error.message : "Failed to fetch visitor analytics"
      ),
      { status: 500 }
    );
  }
}
