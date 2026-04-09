import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/server/auth";
import { sql } from "@/lib/server/db";
import { getOrganizationId } from "@/lib/server/request";

export const runtime = "nodejs";

type ResetStatsResult = {
  deleted_events: number;
  deleted_leads: number;
  unlinked_orders: number;
  reset_at: string;
  note: string;
};

const RESET_NOTE =
  "Campaign stats reset to zero. PostHog visitor stats are external - use the 7D date filter in the visitors dashboard to see fresh data from today forward.";

function wantsHtml(request: NextRequest) {
  const accept = request.headers.get("accept") ?? "";
  const contentType = request.headers.get("content-type") ?? "";
  return accept.includes("text/html") || contentType.includes("application/x-www-form-urlencoded");
}

function renderPage(options: {
  unauthorized?: boolean;
  result?: ResetStatsResult;
  error?: string;
}) {
  const title = options.unauthorized
    ? "Admin authentication required"
    : options.result
      ? "Stats reset complete"
      : "Reset campaign stats";

  const body = options.unauthorized
    ? `
      <div class="notice error">
        <strong>Admin authentication required.</strong>
        <p>Log into the admin portal first, then reopen this page.</p>
      </div>
    `
    : options.error
      ? `
        <div class="notice error">
          <strong>Reset failed.</strong>
          <p>${options.error}</p>
        </div>
      `
      : options.result
        ? `
          <div class="notice success">
            <strong>Stats reset complete.</strong>
            <p>${options.result.note}</p>
          </div>
          <div class="stats">
            <div class="stat"><span>Deleted events</span><strong>${options.result.deleted_events}</strong></div>
            <div class="stat"><span>Deleted leads</span><strong>${options.result.deleted_leads}</strong></div>
            <div class="stat"><span>Unlinked orders</span><strong>${options.result.unlinked_orders}</strong></div>
            <div class="stat"><span>Reset at</span><strong>${new Date(options.result.reset_at).toLocaleString("en-US")}</strong></div>
          </div>
          <div class="actions">
            <a href="/portal/campaigns">Back to campaigns</a>
            <a href="/portal/analytics/visitors">Open visitors dashboard</a>
          </div>
        `
        : `
          <p class="lead">
            Use this page before a new outreach wave to clear campaign funnel counts and lead captures.
          </p>
          <ul>
            <li>Deletes marketing campaign events</li>
            <li>Deletes marketing email leads</li>
            <li>Unlinks old campaign attribution from orders</li>
          </ul>
          <p class="muted">
            This does not delete orders, clients, or invoices. Visitor history in PostHog is external and is not erased here.
          </p>
          <form method="post">
            <button type="submit">Reset campaign stats</button>
          </form>
          <div class="actions">
            <a href="/portal/campaigns">Back to campaigns</a>
            <a href="/portal/analytics/visitors">Open visitors dashboard</a>
          </div>
        `;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      :root {
        color-scheme: dark;
      }
      body {
        margin: 0;
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background:
          radial-gradient(circle at top, rgba(185, 150, 90, 0.18), transparent 30%),
          linear-gradient(180deg, #111315 0%, #171a1d 100%);
        color: #f5f3ef;
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 24px;
      }
      .card {
        width: min(640px, 100%);
        background: rgba(20, 24, 27, 0.94);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 24px;
        box-shadow: 0 30px 80px rgba(0, 0, 0, 0.35);
        padding: 28px;
      }
      h1 {
        margin: 0 0 12px;
        font-size: 32px;
        line-height: 1.1;
      }
      p, li, a, span, strong {
        font-size: 15px;
        line-height: 1.6;
      }
      ul {
        padding-left: 18px;
        color: #d9d6cf;
      }
      .lead, .muted {
        color: #d9d6cf;
      }
      .notice {
        border-radius: 16px;
        padding: 14px 16px;
        margin-bottom: 18px;
      }
      .notice.success {
        border: 1px solid rgba(74, 222, 128, 0.28);
        background: rgba(74, 222, 128, 0.08);
      }
      .notice.error {
        border: 1px solid rgba(248, 113, 113, 0.28);
        background: rgba(248, 113, 113, 0.08);
      }
      .stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 12px;
        margin: 20px 0;
      }
      .stat {
        border: 1px solid rgba(255, 255, 255, 0.09);
        border-radius: 16px;
        padding: 14px;
        background: rgba(255, 255, 255, 0.03);
      }
      .stat span {
        display: block;
        color: #a9b0b6;
        margin-bottom: 8px;
      }
      .stat strong {
        font-size: 20px;
      }
      form {
        margin-top: 20px;
      }
      button {
        appearance: none;
        border: 0;
        border-radius: 999px;
        background: #d7b37d;
        color: #171a1d;
        font-size: 14px;
        font-weight: 700;
        padding: 13px 20px;
        cursor: pointer;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 14px;
        margin-top: 20px;
      }
      a {
        color: #d7b37d;
        text-decoration: none;
      }
      a:hover {
        text-decoration: underline;
      }
    </style>
  </head>
  <body>
    <main class="card">
      <h1>${title}</h1>
      ${body}
    </main>
  </body>
</html>`;
}

async function resetStats(orgId: string): Promise<ResetStatsResult> {
  // 1. Clear all funnel/visit events
  const eventsResult = await sql`
    DELETE FROM marketing_campaign_events
    WHERE organization_id = ${orgId}
    RETURNING id
  `;

  // 2. Clear email lead captures
  const leadsResult = await sql`
    DELETE FROM marketing_email_leads
    WHERE organization_id = ${orgId}
    RETURNING id
  `;

  // 3. Unlink campaign attribution from orders so paid-order counts reset
  const ordersResult = await sql`
    UPDATE admin_orders
    SET
      campaign_id   = NULL,
      campaign_code = NULL,
      updated_at    = NOW()
    WHERE organization_id = ${orgId}
      AND campaign_id IS NOT NULL
    RETURNING id
  `;

  return {
    deleted_events: eventsResult.length,
    deleted_leads: leadsResult.length,
    unlinked_orders: ordersResult.length,
    reset_at: new Date().toISOString(),
    note: RESET_NOTE,
  };
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    if (wantsHtml(request)) {
      return new NextResponse(renderPage({ unauthorized: true }), {
        status: 401,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    return NextResponse.json(
      { ok: false, error: { message: "Admin authentication required." } },
      { status: 401 }
    );
  }

  return new NextResponse(renderPage({}), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

/**
 * POST /api/admin/reset-stats
 *
 * Wipes all marketing event / lead data so campaign and visitor stats
 * start fresh. Use this before a new outreach wave (e.g. postcard drop).
 *
 * What gets cleared:
 *  - marketing_campaign_events   (visit/checkout/conversion funnel events)
 *  - marketing_email_leads       (lead capture signups)
 *  - admin_orders.campaign_id    (unlinks past orders from campaigns so
 *                                 paid-order counts start at 0 too)
 *
 * What is NOT touched:
 *  - admin_orders themselves (orders, clients, invoices all stay intact)
 *  - PostHog visitor data     (external — use the 7D date filter to see
 *                              fresh visitor stats after the reset)
 */
export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    if (wantsHtml(request)) {
      return new NextResponse(renderPage({ unauthorized: true }), {
        status: 401,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    return NextResponse.json(
      { ok: false, error: { message: "Admin authentication required." } },
      { status: 401 }
    );
  }

  const orgId = getOrganizationId(request);

  try {
    const result = await resetStats(orgId);

    if (wantsHtml(request)) {
      return new NextResponse(renderPage({ result }), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    if (wantsHtml(request)) {
      return new NextResponse(
        renderPage({
          error: error instanceof Error ? error.message : "Stats reset failed",
        }),
        {
          status: 500,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: {
          message: error instanceof Error ? error.message : "Stats reset failed",
        },
      },
      { status: 500 }
    );
  }
}
