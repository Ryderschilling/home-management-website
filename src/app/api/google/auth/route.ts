/**
 * /api/google/auth
 *
 * Redirects to Google's OAuth consent screen.
 * Ryder visits this URL once from a logged-in browser session to connect Google Calendar.
 *
 * After authorization, Google redirects to /api/google/callback with a code.
 */

import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/server/auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return new NextResponse(
      "Missing GOOGLE_CLIENT_ID or GOOGLE_REDIRECT_URI environment variables.",
      { status: 500 }
    );
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: [
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/calendar.readonly",
    ].join(" "),
    access_type: "offline",   // required to get a refresh token
    prompt: "consent",        // force consent screen so we always get a refresh token
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  return NextResponse.redirect(authUrl);
}
