/**
 * POST /api/marketing/lead/qualify
 *
 * Called from LeadCapturePopup Step 2 (public — no auth required).
 * Accepts qualification answers, computes a lead score + grade,
 * and patches the existing marketing_email_leads record identified by email.
 *
 * Scoring model (max ~115 raw pts):
 *   owns_property      yes=30  |  looking=0
 *   property_type      single_family=20  |  condo_townhome=12  |  other=5
 *   visit_frequency    rarely=25  |  few_times=15  |  monthly=5
 *   currently_watched  no=25  |  yes=10
 *   neighborhood bonus watersound/naturewalk=15  |  inlet_beach=10  |  other=5  |  none=0
 *
 * Grade tiers:
 *   A (Hot)   ≥ 80
 *   B (Warm)  60–79
 *   C (Cool)  40–59
 *   D (Cold)  < 40
 */

import { NextRequest, NextResponse } from "next/server";
import { ensureAdminTables, sql } from "@/lib/server/db";
import { env } from "@/lib/server/env";

export const runtime = "nodejs";

type QualificationAnswers = {
  owns_property?: "yes" | "looking" | string;
  property_type?: "single_family" | "condo_townhome" | "other" | string;
  visit_frequency?: "monthly" | "few_times" | "rarely" | string;
  currently_watched?: "no" | "yes" | string;
};

function computeScore(answers: QualificationAnswers, neighborhood: string | null): number {
  let score = 0;

  // Owns 30A property
  if (answers.owns_property === "yes") score += 30;

  // Property type
  if (answers.property_type === "single_family") score += 20;
  else if (answers.property_type === "condo_townhome") score += 12;
  else if (answers.property_type === "other") score += 5;

  // Visit frequency — less frequent = needs more oversight = higher value
  if (answers.visit_frequency === "rarely") score += 25;
  else if (answers.visit_frequency === "few_times") score += 15;
  else if (answers.visit_frequency === "monthly") score += 5;

  // Currently watched — no watcher = pain is active
  if (answers.currently_watched === "no") score += 25;
  else if (answers.currently_watched === "yes") score += 10;

  // Neighborhood bonus — in-area = better fit
  const nbhd = (neighborhood ?? "").toLowerCase();
  if (nbhd.includes("watersound") || nbhd.includes("naturewalk")) score += 15;
  else if (nbhd.includes("inlet") || nbhd.includes("30a")) score += 10;
  else if (nbhd) score += 5;

  return score;
}

function computeGrade(score: number): "A" | "B" | "C" | "D" {
  if (score >= 80) return "A";
  if (score >= 60) return "B";
  if (score >= 40) return "C";
  return "D";
}

export async function POST(req: NextRequest) {
  try {
    await ensureAdminTables();

    const body = await req.json().catch(() => ({} as Record<string, unknown>));

    const email = String(body.email ?? "").trim().toLowerCase();
    const answers = (body.answers ?? {}) as QualificationAnswers;

    if (!email) {
      return NextResponse.json(
        { ok: false, error: { message: "Missing email" } },
        { status: 400 }
      );
    }

    const orgId = env.DEFAULT_ORGANIZATION_ID;

    // Fetch existing lead to get neighborhood (captured in Step 1)
    const existing = await sql`
      SELECT id, neighborhood
      FROM marketing_email_leads
      WHERE organization_id = ${orgId}
        AND lower(email) = ${email}
      LIMIT 1
    `;

    if (!existing[0]) {
      return NextResponse.json(
        { ok: false, error: { message: "Lead not found" } },
        { status: 404 }
      );
    }

    const neighborhood = existing[0].neighborhood as string | null;
    const score = computeScore(answers, neighborhood);
    const grade = computeGrade(score);

    await sql`
      UPDATE marketing_email_leads
      SET
        qualification_json = ${JSON.stringify(answers)}::jsonb,
        lead_score         = ${score},
        lead_grade         = ${grade},
        qualified_at       = NOW(),
        updated_at         = NOW()
      WHERE id = ${existing[0].id}
    `;

    return NextResponse.json({ ok: true, data: { score, grade } });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: { message: e instanceof Error ? e.message : "Qualification failed" } },
      { status: 500 }
    );
  }
}
