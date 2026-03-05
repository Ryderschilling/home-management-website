import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const authCookie = request.cookies.get("admin-auth");

  const isProtected =
    request.nextUrl.pathname.startsWith("/admin") ||
    request.nextUrl.pathname.startsWith("/portal");

  // allow the login page through
  const isLogin = request.nextUrl.pathname.startsWith("/admin/login");

  if (isProtected && !isLogin && !authCookie) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/portal/:path*"],
};