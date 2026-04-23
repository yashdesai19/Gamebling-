const configuredApiBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
const inferredApiBase = typeof window === "undefined" ? "http://127.0.0.1:8001" : "";

export const API_BASE_URL = (configuredApiBase || inferredApiBase).replace(/\/+$/, "");

export type ApiErrorShape = { detail?: string } | { error?: string } | unknown;

export class ApiError extends Error {
  status: number;
  body: ApiErrorShape;
  constructor(message: string, status: number, body: ApiErrorShape) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

function getAuthToken(): string | null {
  return localStorage.getItem("access_token") || localStorage.getItem("admin_access_token");
}

export function setAuthToken(token: string) {
  localStorage.setItem("access_token", token);
}

export function clearAuthToken() {
  localStorage.removeItem("access_token");
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
  const headers = new Headers(init?.headers ?? {});
  headers.set("Content-Type", "application/json");
  const token = getAuthToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let res: Response;
  try {
    res = await fetch(url, { ...init, headers });
  } catch (error) {
    throw new ApiError(`Network error: cannot reach API at ${API_BASE_URL || "current origin (/api proxy)"}`, 0, {
      error: String(error),
    });
  }
  const text = await res.text();
  const body = text ? (JSON.parse(text) as unknown) : null;
  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined") {
      clearAuthToken();
      localStorage.removeItem("admin_access_token");
      window.location.href = "/login";
    }

    const msg =
      (body as any)?.detail ??
      (body as any)?.error ??
      `Request failed (${res.status})`;
    throw new ApiError(String(msg), res.status, body);
  }
  return body as T;
}

