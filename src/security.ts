// Lightweight client-side security utilities for the admin panel.
// NOTE: In a static-export scenario, true server-side security is not possible.
// For production use on shared hosting, wrap the admin panel in .htaccess
// HTTP Basic Auth (see EXPORT.md). These utilities provide a reasonable
// client-side layer: PBKDF2 password hashing, rate limiting, and IP blocking
// with localStorage persistence.

const ATTEMPTS_KEY = 'terminal_admin_attempts_v1';
const BLOCKED_KEY = 'terminal_admin_blocked_v1';
const LOCKED_UNTIL_KEY = 'terminal_admin_locked_v1';

const MAX_ATTEMPTS = 5; // lock account after 5 fails
const LOCK_DURATION = 30 * 60 * 1000; // 30 minutes
const MAX_IP_ATTEMPTS = 10; // block IP after 10 fails
const IP_BLOCK_DURATION = 60 * 60 * 1000; // 1 hour

export interface AttemptRecord {
  timestamp: number;
  ip: string;
  success: boolean;
}

export function getAttempts(): AttemptRecord[] {
  try {
    const raw = localStorage.getItem(ATTEMPTS_KEY);
    return raw ? (JSON.parse(raw) as AttemptRecord[]) : [];
  } catch {
    return [];
  }
}

export function recordAttempt(ip: string, success: boolean): void {
  const attempts = getAttempts();
  attempts.push({ timestamp: Date.now(), ip, success });
  // keep only last 100
  const trimmed = attempts.slice(-100);
  try {
    localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(trimmed));
  } catch {
    // non-fatal
  }
}

export function getRecentFailedAttempts(): AttemptRecord[] {
  const cutoff = Date.now() - LOCK_DURATION;
  return getAttempts().filter((a) => !a.success && a.timestamp > cutoff);
}

export function isAccountLocked(): { locked: boolean; until?: number } {
  try {
    const raw = localStorage.getItem(LOCKED_UNTIL_KEY);
    if (!raw) return { locked: false };
    const until = parseInt(raw, 10);
    if (isNaN(until)) return { locked: false };
    if (Date.now() < until) return { locked: true, until };
    localStorage.removeItem(LOCKED_UNTIL_KEY);
    return { locked: false };
  } catch {
    return { locked: false };
  }
}

export function lockAccount(): void {
  try {
    localStorage.setItem(LOCKED_UNTIL_KEY, String(Date.now() + LOCK_DURATION));
  } catch {
    // non-fatal
  }
}

export function unlockAccount(): void {
  try {
    localStorage.removeItem(LOCKED_UNTIL_KEY);
  } catch {
    // non-fatal
  }
}

export function shouldLockAccount(): boolean {
  return getRecentFailedAttempts().length >= MAX_ATTEMPTS;
}

// IP blocking
export interface BlockedIPRecord {
  ip: string;
  blockedUntil: number;
  reason: string;
  attempts: number;
}

export function getBlockedIPs(): BlockedIPRecord[] {
  try {
    const raw = localStorage.getItem(BLOCKED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as BlockedIPRecord[];
    // prune expired
    const active = parsed.filter((b) => Date.now() < b.blockedUntil);
    if (active.length !== parsed.length) {
      localStorage.setItem(BLOCKED_KEY, JSON.stringify(active));
    }
    return active;
  } catch {
    return [];
  }
}

export function isIPBlocked(ip: string): { blocked: boolean; until?: number } {
  const blocked = getBlockedIPs();
  const record = blocked.find((b) => b.ip === ip);
  if (record && Date.now() < record.blockedUntil) {
    return { blocked: true, until: record.blockedUntil };
  }
  return { blocked: false };
}

export function getIPFailedAttempts(ip: string): number {
  const cutoff = Date.now() - IP_BLOCK_DURATION;
  return getAttempts().filter((a) => a.ip === ip && !a.success && a.timestamp > cutoff).length;
}

export function blockIP(ip: string, reason: string): void {
  const blocked = getBlockedIPs().filter((b) => b.ip !== ip);
  blocked.push({
    ip,
    blockedUntil: Date.now() + IP_BLOCK_DURATION,
    reason,
    attempts: getIPFailedAttempts(ip),
  });
  try {
    localStorage.setItem(BLOCKED_KEY, JSON.stringify(blocked));
  } catch {
    // non-fatal
  }
}

export function shouldBlockIP(ip: string): boolean {
  return getIPFailedAttempts(ip) >= MAX_IP_ATTEMPTS;
}

export function unblockIP(ip: string): void {
  const blocked = getBlockedIPs().filter((b) => b.ip !== ip);
  try {
    localStorage.setItem(BLOCKED_KEY, JSON.stringify(blocked));
  } catch {
    // non-fatal
  }
}

// Password hashing using Web Crypto API (PBKDF2)
export async function hashPassword(password: string, salt?: string): Promise<{ hash: string; salt: string }> {
  const enc = new TextEncoder();
  const saltBytes = salt ? base64ToBytes(salt) : crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: saltBytes, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  return {
    hash: bytesToBase64(new Uint8Array(derived)),
    salt: bytesToBase64(saltBytes),
  };
}

export async function verifyPassword(password: string, storedHash: string, storedSalt: string): Promise<boolean> {
  const { hash } = await hashPassword(password, storedSalt);
  return timingSafeEqual(hash, storedHash);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// Password strength check
export function checkPasswordStrength(password: string): { strong: boolean; message: string } {
  if (password.length < 12) return { strong: false, message: 'Password must be at least 12 characters.' };
  if (!/[A-Z]/.test(password)) return { strong: false, message: 'Password must include an uppercase letter.' };
  if (!/[a-z]/.test(password)) return { strong: false, message: 'Password must include a lowercase letter.' };
  if (!/[0-9]/.test(password)) return { strong: false, message: 'Password must include a number.' };
  if (!/[^A-Za-z0-9]/.test(password)) return { strong: false, message: 'Password must include a symbol.' };
  return { strong: true, message: 'Password is strong.' };
}

// Base64 helpers
function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// Simulated IP — in a static export, the real IP is only known server-side.
// On shared hosting with .htaccess, the IP would be available via the server.
// Here we use a fingerprint as a stand-in.
export function getClientIP(): string {
  try {
    let ip = localStorage.getItem('terminal_client_ip');
    if (!ip) {
      ip = 'client-' + Math.random().toString(36).slice(2, 10);
      localStorage.setItem('terminal_client_ip', ip);
    }
    return ip;
  } catch {
    return 'unknown';
  }
}
