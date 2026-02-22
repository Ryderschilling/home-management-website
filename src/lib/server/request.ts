import type { NextRequest } from "next/server";

export function getOrganizationId(request: NextRequest): string {
  const organizationId = request.headers.get("x-organization-id")?.trim();

  if (!organizationId) {
    throw new Error("Missing x-organization-id header");
  }

  return organizationId;
}
