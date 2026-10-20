import { SUPABASE_URL, ANON_KEY } from './supabaseConfig';

const TOKEN_KEY = 'terminal_admin_token_v1';

function edgeUrl(): string {
  return `${SUPABASE_URL}/functions/v1/admin-data`;
}

function edgeHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${ANON_KEY}`,
    apikey: ANON_KEY,
  };
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function tokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return typeof payload.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
}

function isTokenValid(token: string): boolean {
  const exp = tokenExpiry(token);
  if (exp === null) return false;
  return Math.floor(Date.now() / 1000) < exp;
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // non-fatal
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // non-fatal
  }
}

export interface LoginResult {
  success: boolean;
  message: string;
  token?: string;
  mustChangePassword?: boolean;
}

export async function login(password: string): Promise<LoginResult> {
  const res = await fetch(edgeUrl(), {
    method: 'POST',
    headers: edgeHeaders(),
    body: JSON.stringify({ action: 'login', password }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Server error (${res.status})`);
  }
  const data = await res.json() as LoginResult;
  if (data.success && data.token) {
    setToken(data.token);
  }
  return data;
}

export function isLoggedIn(): boolean {
  const token = getToken();
  if (!token) return false;
  if (!isTokenValid(token)) {
    clearToken();
    return false;
  }
  return true;
}

export function logout(): void {
  clearToken();
}

export async function changePassword(
  current: string,
  next: string
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(edgeUrl(), {
    method: 'POST',
    headers: edgeHeaders(),
    body: JSON.stringify({ action: 'changePassword', currentPassword: current, newPassword: next, token: getToken() }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Server error (${res.status})`);
  }
  return await res.json();
}

export async function isDefaultPassword(): Promise<boolean> {
  const res = await fetch(edgeUrl(), {
    method: 'POST',
    headers: edgeHeaders(),
    body: JSON.stringify({ action: 'isDefaultPassword' }),
  });
  if (!res.ok) return true;
  const data = await res.json() as { isDefault: boolean };
  return data.isDefault;
}
