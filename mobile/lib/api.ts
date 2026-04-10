import * as SecureStore from "expo-secure-store";
import { API_URL } from "./constants";

const TOKEN_KEY = "access-token";
const REFRESH_KEY = "refresh-token";

// ─── Token management ────────────────────────────────────────────────────────

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_KEY);
}

export async function saveTokens(accessToken: string, refreshToken: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
  await SecureStore.setItemAsync(REFRESH_KEY, refreshToken);
}

export async function clearTokens() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}

// ─── API client ──────────────────────────────────────────────────────────────

async function refreshTokens(): Promise<boolean> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_URL}/api/mobile/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      await clearTokens();
      return false;
    }

    const data = await res.json();
    await saveTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

export async function api<T = unknown>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const token = await getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options?.headers as Record<string, string>) ?? {}),
  };

  let res = await fetch(`${API_URL}${path}`, { ...options, headers });

  // Auto-refresh on 401
  if (res.status === 401 && token) {
    const refreshed = await refreshTokens();
    if (refreshed) {
      const newToken = await getAccessToken();
      headers.Authorization = `Bearer ${newToken}`;
      res = await fetch(`${API_URL}${path}`, { ...options, headers });
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }

  return res.json();
}

// ─── Auth functions ──────────────────────────────────────────────────────────

export async function login(
  provider: "credentials" | "customer-credentials",
  phone: string,
  password: string
): Promise<{
  ok: boolean;
  error?: string;
  user?: { id: string; name: string; role: string; isVerified: boolean };
}> {
  try {
    const res = await fetch(`${API_URL}/api/mobile/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, password, provider }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { ok: false, error: data.error ?? "Xatolik" };
    }

    await saveTokens(data.accessToken, data.refreshToken);
    return { ok: true, user: data.user };
  } catch {
    return { ok: false, error: "Server bilan bog'lanishda xatolik" };
  }
}

export async function register(data: {
  fullName: string;
  phone: string;
  password: string;
  role?: string;
  serviceArea?: string;
  categories?: string[];
  bio?: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) return { ok: false, error: json.error ?? "Xatolik" };
    return { ok: true };
  } catch {
    return { ok: false, error: "Server bilan bog'lanishda xatolik" };
  }
}
