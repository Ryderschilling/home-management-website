import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Homeowner portal gate. Anything under /portal needs the session cookie,
 * except the login/signup/reset pages. The cookie only proves a browser once
 * logged in; the real check (row exists, not expired, email verified) happens
 * in the portal layout against the database.
 */
const PUBLIC = ["/portal/login", "/portal/signup", "/portal/forgot", "/portal/reset"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC.some((p) => pathname === p || pathname.startsWith(p + "/"))) return NextResponse.next();

  if (!request.cookies.get("chm_portal")?.value) {
    const url = new URL("/portal/login", request.url);
    if (pathname !== "/portal") url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/portal/:path*"],
};
