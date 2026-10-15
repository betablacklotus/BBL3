import { SUPABASE_URL, ANON_KEY } from './supabaseConfig';

const SESSION_KEY = 'terminal_admin_session_v1';
const SESSION_DURATION = 2 * 60 * 60 * 1000;

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

export async function login(password: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(edgeUrl(), {
    method: 'POST',
    headers: edgeHeaders(),
    body: JSON.stringify({ action: 'login', password }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Server error (${res.status})`);
  }
  const data = await res.json();
  if (data.success) {
    try {
      localStorage.setItem(SESSION_KEY, String(Date.now() + SESSION_DURATION));
    } catch {
      // non-fatal
    }
  }
  return { success: data.success, message: data.message };
}

export function isLoggedIn(): boolean {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    const until = parseInt(raw, 10);
    if (isNaN(until)) return false;
    if (Date.now() > until) {
      localStorage.removeItem(SESSION_KEY);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function logout(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // non-fatal
  }
}

export async function changePassword(
  current: string,
  next: string
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(edgeUrl(), {
    method: 'POST',
    headers: edgeHeaders(),
    body: JSON.stringify({ action: 'changePassword', currentPassword: current, newPassword: next }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Server error (${res.status})`);
  }
  return await res.json();
}

export function isDefaultPassword(): boolean {
  return true;
}
