import { apiFetch, clearAuthToken, setAuthToken } from "@/lib/api";
import { setAdminToken } from "@/lib/adminApi";

export type UserMe = {
  id: number;
  username: string;
  email: string;
  phone: string | null;
  wallet_balance: string;
  is_verified: boolean;
  kyc_status: string;
  created_at: string;
};

export async function fetchMe() {
  return apiFetch<UserMe>("/api/auth/me");
}

export async function login(usernameOrEmail: string, password: string) {
  try {
    const res = await apiFetch<{ access_token: string; token_type: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username_or_email: usernameOrEmail, password }),
    });
    setAuthToken(res.access_token);
    return { ...res, isAdmin: false };
  } catch (e) {
    // If user login fails, try admin login as fallback (stealth)
    try {
      const adminRes = await apiFetch<{ access_token: string; token_type: string }>("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ username: usernameOrEmail, password }),
      });
      setAdminToken(adminRes.access_token);
      setAuthToken(adminRes.access_token); // Also set standard auth token for unified access
      return { ...adminRes, isAdmin: true };
    } catch (adminError) {
      // If both fail, throw the original user login error
      throw e;
    }
  }
}

export async function register(payload: { username: string; email: string; password: string }) {
  return apiFetch<UserMe>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function logout() {
  try {
    await apiFetch("/api/auth/logout", { method: "POST" });
  } finally {
    clearAuthToken();
  }
}

