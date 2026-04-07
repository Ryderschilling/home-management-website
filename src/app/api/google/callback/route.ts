/**
 * /api/google/callback
 *
 * Google redirects here after Ryder authorizes the app.
 * Exchanges the authorization code for tokens and stores the refresh token in the DB.
 *
 * IMPORTANT: This URL must be added as an authorized redirect URI in Google Cloud Console
 * and set as GOOGLE_REDIRECT_URI in Vercel env vars:
 *   https://coastalhomemngt30a.com/api/google/callback
 */

import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/server/auth";
import { getOrganizationId } from "@/lib/server/request";
import { saveRefreshToken } from "@/lib/server/services/google-calendar";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return new NextResponse(
      `Google authorization failed: ${error}. Go back to the portal and try again.`,
      { status: 400 }
    );
  }

  if (!code) {
    return new NextResponse("Missing authorization code from Google.", { status: 400 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return new NextResponse("Missing Google OAuth environment variables.", { status: 500 });
  }

  // Exchange the authorization code for access + refresh tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }).toString(),
  });

  const tokens = (await tokenRes.json()) as {
    access_token?: string;
    refresh_token?: string;
    error?: string;
    error_description?: string;
  };

  if (!tokens.refresh_token) {
    return new NextResponse(
      `Google did not return a refresh token. ${tokens.error ?? ""} ${tokens.error_description ?? ""}`.trim() +
        "\n\nTry revoking access at https://myaccount.google.com/permissions and visiting /api/google/auth again.",
      { status: 500 }
    );
  }

  const organizationId = getOrganizationId(request);
  await saveRefreshToken(organizationId, tokens.refresh_token);

  // Redirect back to the portal with a success message
  const appUrl = process.env.APP_URL ?? "";
  return NextResponse.redirect(`${appUrl}/portal?gcal=connected`);
}
