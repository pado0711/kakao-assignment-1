import { cookies } from "next/headers";

export const SESSION_COOKIE = "todo_session";

export class BackendError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function backendUrl(path: string): string {
  const baseUrl = process.env.BACKEND_URL ?? "http://localhost:8000";
  return `${baseUrl}${path}`;
}

export async function backendFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const response = await fetch(backendUrl(path), { ...init, headers, cache: "no-store" });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new BackendError(response.status, body?.detail ?? "요청을 처리하지 못했습니다.");
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function getBackendUrl(path: string): string {
  return backendUrl(path);
}
