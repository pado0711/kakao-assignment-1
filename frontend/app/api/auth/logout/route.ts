import { NextRequest, NextResponse } from "next/server";
import { proxyRequest, sessionCookieOptions } from "@/app/api/_lib/proxy";
import { SESSION_COOKIE } from "@/lib/backend";

export async function POST(request: NextRequest) {
  const response = await proxyRequest(request, "/auth/logout", "POST");
  const nextResponse = response.ok
    ? new NextResponse(null, { status: 204 })
    : response;
  nextResponse.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
  return nextResponse;
}
