import { NextRequest, NextResponse } from "next/server";
import { getBackendUrl, SESSION_COOKIE } from "@/lib/backend";

export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}

export function validateMutationOrigin(request: NextRequest): NextResponse | null {
  const origin = request.headers.get("origin");
  const forwardedHost = request.headers.get("x-forwarded-host");
  const requestHost = forwardedHost ?? request.headers.get("host");
  if (origin) {
    try {
      if (!requestHost || new URL(origin).host !== requestHost) {
        return NextResponse.json({ detail: "허용되지 않은 요청입니다." }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ detail: "허용되지 않은 요청입니다." }, { status: 403 });
    }
  }
  return null;
}

export async function proxyRequest(
  request: NextRequest,
  backendPath: string,
  method = request.method,
): Promise<NextResponse> {
  const originError = method === "GET" ? null : validateMutationOrigin(request);
  if (originError) return originError;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const hasBody = !["GET", "HEAD", "DELETE"].includes(method);
  const response = await fetch(getBackendUrl(backendPath), {
    method,
    headers,
    body: hasBody ? await request.text() : undefined,
    cache: "no-store",
  });
  const body = response.status === 204 ? null : await response.text();
  return new NextResponse(body, {
    status: response.status,
    headers: body ? { "Content-Type": response.headers.get("content-type") ?? "application/json" } : {},
  });
}

export async function authRequest(request: NextRequest, backendPath: string): Promise<NextResponse> {
  const originError = validateMutationOrigin(request);
  if (originError) return originError;
  const response = await fetch(getBackendUrl(backendPath), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: await request.text(),
    cache: "no-store",
  });
  const body = await response.json().catch(() => ({ detail: "인증 요청에 실패했습니다." }));
  if (!response.ok) return NextResponse.json(body, { status: response.status });
  const nextResponse = NextResponse.json({ user: body.user }, { status: response.status });
  nextResponse.cookies.set(SESSION_COOKIE, body.session_token, sessionCookieOptions());
  return nextResponse;
}
