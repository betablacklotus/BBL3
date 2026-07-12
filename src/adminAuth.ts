// Admin credential storage. Default password is set on first run.
// CHANGE THE DEFAULT PASSWORD immediately after first login.
// In production, also protect /backstage-3k9mxf2p7qw4 with .htaccess (see EXPORT.md).

import { hashPassword, verifyPassword } from './security';

const CRED_KEY = 'terminal_admin_cred_v1';
const SESSION_KEY = 'terminal_admin_session_v1';
const SESSION_DURATION = 2 * 60 * 60 * 1000; // 2 hours

const DEFAULT_PASSWORD = 'ChangeMe!Str0ngP@ss';

interface StoredCred {
  passwordHash: string;
  salt: string;
  initialized: boolean;
}

async function getCredentials(): Promise<StoredCred | null> {
  try {
    const raw = localStorage.getItem(CRED_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredCred;
  } catch {
    return null;
  }
}

async function ensureInitialized(): Promise<StoredCred> {
  let cred = await getCredentials();
  if (!cred) {
    const { hash, salt } = await hashPassword(DEFAULT_PASSWORD);
    cred = { passwordHash: hash, salt, initialized: true };
    try {
      localStorage.setItem(CRED_KEY, JSON.stringify(cred));
    } catch {
      // non-fatal
    }
  }
  return cred;
}

export async function login(password: string): Promise<{ success: boolean; message: string }> {
  const cred = await ensureInitialized();
  const valid = await verifyPassword(password, cred.passwordHash, cred.salt);
  if (valid) {
    try {
      localStorage.setItem(SESSION_KEY, String(Date.now() + SESSION_DURATION));
    } catch {
      // non-fatal
    }
    return { success: true, message: 'Login successful.' };
  }
  return { success: false, message: 'Invalid password.' };
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
  const cred = await ensureInitialized();
  const valid = await verifyPassword(current, cred.passwordHash, cred.salt);
  if (!valid) return { success: false, message: 'Current password is incorrect.' };
  const { hash, salt } = await hashPassword(next);
  const updated: StoredCred = { passwordHash: hash, salt, initialized: true };
  try {
    localStorage.setItem(CRED_KEY, JSON.stringify(updated));
  } catch {
    return { success: false, message: 'Could not save new password.' };
  }
  return { success: true, message: 'Password changed.' };
}

export function isDefaultPassword(): boolean {
  return DEFAULT_PASSWORD === 'ChangeMe!Str0ngP@ss';
}
