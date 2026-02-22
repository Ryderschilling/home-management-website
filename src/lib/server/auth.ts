import type { NextRequest } from "next/server";

export function isAdminRequest(request: NextRequest): boolean {
  return request.cookies.get("admin-auth")?.value === "true";
}
