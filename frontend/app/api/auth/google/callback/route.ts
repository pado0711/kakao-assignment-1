import { NextRequest, NextResponse } from "next/server";
import { getBackendUrl, SESSION_COOKIE } from "@/lib/backend";
import { sessionCookieOptions } from "@/app/api/_lib/proxy";

const STATE_COOKIE = "google_oauth_state";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const expectedState = request.cookies.get(STATE_COOKIE)?.value;
  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(new URL("/login?error=invalid_oauth_state", request.url));
  }
  const redirectUri = new URL("/api/auth/google/callback", request.nextUrl.origin).toString();
  const backendResponse = await fetch(getBackendUrl("/auth/google"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, redirect_uri: redirectUri }),
    cache: "no-store",
  });
  if (!backendResponse.ok) {
    return NextResponse.redirect(new URL(`/login?error=google_${backendResponse.status}`, request.url));
  }
  const body = await backendResponse.json();
  const response = NextResponse.redirect(new URL("/todos", request.url));
  response.cookies.set(SESSION_COOKIE, body.session_token, sessionCookieOptions());
  response.cookies.set(STATE_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
