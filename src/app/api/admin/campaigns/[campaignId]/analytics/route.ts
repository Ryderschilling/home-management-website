import { NextRequest, NextResponse } from "next/server";

import { isAdminRequest } from "@/lib/server/auth";
import { ensureAdminTables, sql } from "@/lib/server/db";
import { getOrganizationId } from "@/lib/server/request";

export const runtime = "nodejs";

type JsonMap = Record<string, unknown>;

type CampaignEventRow = {
  id: string;
  session_key: string | null;
  event_type: string;
  page_path: string | null;
  order_id: string | null;
  metadata_json: unknown;
  created_at: string;
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function asInteger(value: unknown) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? Math.round(numeric) : 0;
}

function ratio(numerator: number, denominator: number) {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) {
    return 0;
  }

  return numerator / denominator;
}

function normalizeMetadata(value: unknown): JsonMap | null {
  if (!value) return null;

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as JsonMap;
      }
    } catch {
      return { raw: value };
    }
  }

  if (typeof value === "object" && !Array.isArray(value)) {
    return value as JsonMap;
  }

  return null;
}

function summarizeMetadata(metadata: JsonMap | null) {
  if (!metadata) return "";

  const parts: string[] = [];

  for (const [key, value] of Object.entries(metadata)) {
    if (value === null || value === undefined || value === "") continue;

    let displayValue = "";

    if (typeof value === "string") {
      displayValue = value.trim();
    } else if (typeof value === "number" || typeof value === "boolean") {
      displayValue = String(value);
    } else if (Array.isArray(value)) {
      displayValue = value.slice(0, 3).map((entry) => safe(entry)).join(", ");
    } else if (typeof value === "object") {
      displayValue = Object.entries(value as JsonMap)
        .slice(0, 2)
        .map(([nestedKey, nestedValue]) => `${nestedKey}:${safe(nestedValue)}`)
        .join(", ");
    }

    if (!displayValue) continue;

    const collapsed = displayValue.replace(/\s+/g, " ").slice(0, 72);
    parts.push(`${key}: ${collapsed}`);

    if (parts.length >= 4) break;
  }

  return parts.join(" • ");
}

function getFlowStep(eventType: string, pagePath: string | null) {
  const normalizedPath = safe(pagePath);

  if (eventType === "page_view") {
    if (normalizedPath === "/qr") return "/qr";
    if (normalizedPath === "/qr/upgrade") return "/qr/upgrade";
    if (normalizedPath === "/qr/success") return "/qr/success";
    return normalizedPath || null;
  }

  if (eventType === "add_on_selected") return "add_on_selected";
  if (eventType === "checkout_started") return "checkout_started";
  if (eventType === "order_paid") return "order_paid";
  if (eventType === "email_opt_in") return "lead_signup";
  if (eventType === "upload_completed") return "upload_completed";

  return null;
}

function buildPathTransitions(events: CampaignEventRow[]) {
  const byJourney = new Map<string, string[]>();

  for (const event of events) {
    const flowStep = getFlowStep(event.event_type, event.page_path);
    if (!flowStep) continue;

    const journeyKey =
      safe(event.session_key) ||
      (safe(event.order_id) ? `order:${safe(event.order_id)}` : `event:${event.id}`);

    const currentSteps = byJourney.get(journeyKey) ?? [];

    if (currentSteps[currentSteps.length - 1] !== flowStep) {
      currentSteps.push(flowStep);
    }

    byJourney.set(journeyKey, currentSteps);
  }

  const counts = new Map<string, { from_step: string; to_step: string; count: number }>();

  for (const steps of byJourney.values()) {
    for (let index = 1; index < steps.length; index += 1) {
      const fromStep = steps[index - 1];
      const toStep = steps[index];
      const key = `${fromStep}=>${toStep}`;
      const existing = counts.get(key);

      counts.set(key, {
        from_step: fromStep,
        to_step: toStep,
        count: (existing?.count ?? 0) + 1,
      });
    }
  }

  return Array.from(counts.values()).sort((left, right) => {
    if (right.count !== left.count) return right.count - left.count;
    if (left.from_step !== right.from_step) {
      return left.from_step.localeCompare(right.from_step);
    }
    return left.to_step.localeCompare(right.to_step);
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  if (!isAdminRequest(request)) {
    return NextResponse.json(
      { ok: false, error: { message: "Admin authentication required." } },
      { status: 401 }
    );
  }

  try {
    await ensureAdminTables();

    const { campaignId } = await params;
    const orgId = getOrganizationId(request);

    const campaignRows = await sql`
      SELECT
        id,
        name,
        campaign_code,
        channel,
        landing_path,
        flyers_sent,
        print_cost_cents,
        distribution_cost_cents,
        notes,
        active,
        created_at,
        updated_at
      FROM marketing_campaigns
      WHERE organization_id = ${orgId}
        AND id = ${campaignId}
      LIMIT 1
    `;

    const campaign = campaignRows[0];

    if (!campaign) {
      return NextResponse.json(
        { ok: false, error: { message: "Campaign not found" } },
        { status: 404 }
      );
    }

    const metricRows = await sql`
      WITH event_metrics AS (
        SELECT
          COUNT(*) FILTER (WHERE event_type = 'page_view')::int AS visits,
          COUNT(DISTINCT session_key) FILTER (
            WHERE event_type = 'page_view'
              AND session_key IS NOT NULL
              AND session_key <> ''
          )::int AS unique_visitors,
          COUNT(*) FILTER (WHERE event_type = 'checkout_started')::int AS checkout_starts,
          COUNT(*) FILTER (WHERE event_type = 'add_on_selected')::int AS add_on_selects,
          COUNT(*) FILTER (
            WHERE event_type = 'checkout_started'
              AND LOWER(COALESCE(metadata_json->>'addonSelected', 'false')) IN ('true', '1', 'yes', 'on')
          )::int AS add_on_checkout_starts
        FROM marketing_campaign_events
        WHERE organization_id = ${orgId}
          AND campaign_id = ${campaignId}
      ),
      order_metrics AS (
        SELECT
          COUNT(*) FILTER (WHERE status = 'PAID')::int AS paid_orders,
          COUNT(*) FILTER (WHERE upload_completed_at IS NOT NULL)::int AS upload_completed,
          COUNT(*) FILTER (WHERE used_promotion_code = TRUE)::int AS discount_uses,
          COALESCE(SUM(total_amount_cents), 0)::int AS revenue_cents,
          COUNT(*) FILTER (
            WHERE status = 'PAID'
              AND (
                COALESCE(addon_product_key, '') <> ''
                OR COALESCE(addon_product_name, '') <> ''
              )
          )::int AS add_on_paid_orders,
          COALESCE(
            SUM(
              CASE
                WHEN status = 'PAID'
                  AND (
                    COALESCE(addon_product_key, '') <> ''
                    OR COALESCE(addon_product_name, '') <> ''
                  )
                THEN COALESCE(addon_price_cents, 0)
                ELSE 0
              END
            ),
            0
          )::int AS add_on_revenue_cents
        FROM admin_orders
        WHERE organization_id = ${orgId}
          AND campaign_id = ${campaignId}
      ),
      lead_metrics AS (
        SELECT COUNT(*)::int AS email_leads
        FROM marketing_email_leads
        WHERE organization_id = ${orgId}
          AND campaign_id = ${campaignId}
      )
      SELECT
        COALESCE(e.visits, 0) AS visits,
        COALESCE(e.unique_visitors, 0) AS unique_visitors,
        COALESCE(e.checkout_starts, 0) AS checkout_starts,
        COALESCE(e.add_on_selects, 0) AS add_on_selects,
        COALESCE(e.add_on_checkout_starts, 0) AS add_on_checkout_starts,
        COALESCE(o.paid_orders, 0) AS paid_orders,
        COALESCE(o.upload_completed, 0) AS upload_completed,
        COALESCE(o.discount_uses, 0) AS discount_uses,
        COALESCE(o.revenue_cents, 0) AS revenue_cents,
        COALESCE(o.add_on_paid_orders, 0) AS add_on_paid_orders,
        COALESCE(o.add_on_revenue_cents, 0) AS add_on_revenue_cents,
        COALESCE(l.email_leads, 0) AS email_leads
      FROM event_metrics e
      CROSS JOIN order_metrics o
      CROSS JOIN lead_metrics l
    `;

    const metrics = metricRows[0] ?? {};

    const recentEventsRows = await sql<CampaignEventRow[]>`
      SELECT
        id,
        session_key,
        event_type,
        page_path,
        order_id,
        metadata_json,
        created_at
      FROM marketing_campaign_events
      WHERE organization_id = ${orgId}
        AND campaign_id = ${campaignId}
      ORDER BY created_at DESC, id DESC
      LIMIT 80
    `;

    const flowEventRows = await sql<CampaignEventRow[]>`
      SELECT
        id,
        session_key,
        event_type,
        page_path,
        order_id,
        metadata_json,
        created_at
      FROM marketing_campaign_events
      WHERE organization_id = ${orgId}
        AND campaign_id = ${campaignId}
        AND event_type IN (
          'page_view',
          'add_on_selected',
          'checkout_started',
          'order_paid',
          'email_opt_in',
          'upload_completed'
        )
      ORDER BY COALESCE(session_key, order_id, id), created_at ASC, id ASC
    `;

    const visits = asInteger(metrics.visits);
    const uniqueVisitors = asInteger(metrics.unique_visitors);
    const checkoutStarts = asInteger(metrics.checkout_starts);
    const paidOrders = asInteger(metrics.paid_orders);
    const uploadCompleted = asInteger(metrics.upload_completed);
    const discountUses = asInteger(metrics.discount_uses);
    const revenueCents = asInteger(metrics.revenue_cents);
    const emailLeads = asInteger(metrics.email_leads);
    const addOnSelects = asInteger(metrics.add_on_selects);
    const addOnCheckoutStarts = asInteger(metrics.add_on_checkout_starts);
    const addOnPaidOrders = asInteger(metrics.add_on_paid_orders);
    const addOnRevenueCents = asInteger(metrics.add_on_revenue_cents);

    const recentEvents = recentEventsRows.map((event) => {
      const metadata = normalizeMetadata(event.metadata_json);

      return {
        id: safe(event.id),
        created_at: event.created_at,
        event_type: safe(event.event_type),
        session_key: safe(event.session_key) || null,
        page_path: safe(event.page_path) || null,
        order_id: safe(event.order_id) || null,
        metadata,
        metadata_summary: summarizeMetadata(metadata),
      };
    });

    return NextResponse.json({
      ok: true,
      data: {
        campaign: {
          id: safe(campaign.id),
          name: safe(campaign.name),
          campaign_code: safe(campaign.campaign_code),
          channel: safe(campaign.channel),
          landing_path: safe(campaign.landing_path),
          flyers_sent: asInteger(campaign.flyers_sent),
          print_cost_cents: asInteger(campaign.print_cost_cents),
          distribution_cost_cents: asInteger(campaign.distribution_cost_cents),
          notes: campaign.notes ?? null,
          active: campaign.active !== false,
          created_at: campaign.created_at,
          updated_at: campaign.updated_at,
        },
        summary: {
          visits,
          unique_visitors: uniqueVisitors,
          checkout_starts: checkoutStarts,
          paid_orders: paidOrders,
          revenue_cents: revenueCents,
          email_leads: emailLeads,
          upload_completed: uploadCompleted,
          discount_uses: discountUses,
          add_on_selects: addOnSelects,
          add_on_checkout_starts: addOnCheckoutStarts,
          add_on_paid_orders: addOnPaidOrders,
          add_on_revenue_cents: addOnRevenueCents,
          add_on_attach_rate: ratio(addOnPaidOrders, paidOrders),
        },
        funnel: [
          { key: "page_views", label: "Page views", count: visits },
          { key: "add_on_selects", label: "Add-on selects", count: addOnSelects },
          { key: "checkout_starts", label: "Checkout starts", count: checkoutStarts },
          { key: "paid_orders", label: "Paid orders", count: paidOrders },
          { key: "lead_captures", label: "Lead captures", count: emailLeads },
          { key: "upload_completed", label: "Upload completed", count: uploadCompleted },
        ],
        conversion_rates: {
          visit_to_checkout: ratio(checkoutStarts, visits),
          visit_to_paid_order: ratio(paidOrders, visits),
          checkout_to_paid: ratio(paidOrders, checkoutStarts),
          add_on_attach_rate: ratio(addOnPaidOrders, paidOrders),
          lead_conversion_rate: ratio(emailLeads, visits),
        },
        path_transitions: buildPathTransitions(flowEventRows),
        recent_events: recentEvents,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          message:
            error instanceof Error
              ? error.message
              : "Failed to load campaign analytics",
        },
      },
      { status: 400 }
    );
  }
}
