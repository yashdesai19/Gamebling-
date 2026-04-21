import { API_BASE_URL, ApiError } from "@/lib/api";

function getAdminToken(): string | null {
  return localStorage.getItem("admin_access_token");
}

export function setAdminToken(token: string) {
  localStorage.setItem("admin_access_token", token);
}

export function clearAdminToken() {
  localStorage.removeItem("admin_access_token");
}

export async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
  const headers = new Headers(init?.headers ?? {});
  headers.set("Content-Type", "application/json");
  const token = getAdminToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(url, { ...init, headers });
  const text = await res.text();
  const body = text ? (JSON.parse(text) as unknown) : null;
  if (!res.ok) {
    const msg = (body as any)?.detail ?? (body as any)?.error ?? `Request failed (${res.status})`;
    throw new ApiError(String(msg), res.status, body);
  }
  return body as T;
}

