import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/server/auth";
import { getOrganizationId } from "@/lib/server/request";
import { ensureAdminTables, sql } from "@/lib/server/db";

export const runtime = "nodejs";

function csvEscape(value: unknown) {
  const s = String(value ?? "");
  if (s.includes('"') || s.includes(",") || s.includes("\n") || s.includes("\r")) {
    return `"${s.replaceAll('"', '""')}"`;
  }
  return s;
}

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ ok: false, error: { message: "UNAUTHORIZED" } }, { status: 401 });
  }

  try {
    await ensureAdminTables();
    const organizationId = getOrganizationId(req);

    const rows = await sql`
      SELECT
        created_at,
        status,
        total_amount_cents,
        rock_color,
        customer_name,
        customer_email,
        customer_phone,
        service_address,
        stripe_session_id,
        notes
      FROM admin_orders
      WHERE organization_id = ${organizationId}
        AND source = 'qr'
      ORDER BY created_at DESC
    `;

    const header = [
      "created_at",
      "status",
      "total_amount_usd",
      "rock_color",
      "customer_name",
      "customer_email",
      "customer_phone",
      "service_address",
      "stripe_session_id",
      "notes",
    ].join(",");

    const lines = rows.map((r: any) => {
      const usd = r.total_amount_cents ? (Number(r.total_amount_cents) / 100).toFixed(2) : "0.00";
      return [
        csvEscape(r.created_at),
        csvEscape(r.status),
        csvEscape(usd),
        csvEscape(r.rock_color),
        csvEscape(r.customer_name),
        csvEscape(r.customer_email),
        csvEscape(r.customer_phone),
        csvEscape(r.service_address),
        csvEscape(r.stripe_session_id),
        csvEscape(r.notes),
      ].join(",");
    });

    const csv = [header, ...lines].join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": 'attachment; filename="qr-orders.csv"',
      },
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: { message: e instanceof Error ? e.message : "Export failed" } },
      { status: 500 }
    );
  }
}