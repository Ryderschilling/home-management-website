import type { NextRequest } from "next/server";

/**
 * V1: single-org internal system.
 * - If x-organization-id header is present, use it (future multi-org).
 * - Otherwise fall back to DEFAULT_ORGANIZATION_ID (single-owner workflow).
 */
export function getOrganizationId(request: NextRequest): string {
  const fromHeader = request.headers.get("x-organization-id")?.trim();
  if (fromHeader) return fromHeader;

  const fallback = process.env.DEFAULT_ORGANIZATION_ID?.trim();
  if (!fallback) {
    throw new Error("Missing DEFAULT_ORGANIZATION_ID env var (or x-organization-id header).");
  }

  return fallback;
}