import { SUPABASE_URL, ANON_KEY } from './supabaseConfig';
import { getToken } from './adminAuth';

export interface BunnyConfig {
  storageZone: string;
  storageKey: string;
  cdnUrl: string;
  storageHostname: string;
  streamLibraryId: string;
  streamApiKey: string;
}

const DEFAULTS: BunnyConfig = {
  storageZone: '',
  storageKey: '',
  cdnUrl: '',
  storageHostname: 'storage.bunnycdn.com',
  streamLibraryId: '',
  streamApiKey: '',
};

let _cache: BunnyConfig | null = null;

function adminBody(action: string, extra: Record<string, unknown> = {}): string {
  return JSON.stringify({ action, token: getToken(), ...extra });
}

const adminHeaders: Record<string, string> = {
  'Content-Type': 'application/json',
  apikey: ANON_KEY,
  Authorization: `Bearer ${ANON_KEY}`,
};

export async function getBunnyConfig(): Promise<BunnyConfig> {
  if (_cache) return _cache;
  const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-data`, {
    method: 'POST',
    headers: adminHeaders,
    body: adminBody('getBunnyConfig'),
  });
  if (!res.ok) return { ...DEFAULTS };
  const data: Record<string, unknown> = await res.json();
  _cache = { ...DEFAULTS, ...data };
  return _cache;
}

export async function setBunnyConfig(cfg: BunnyConfig): Promise<void> {
  await fetch(`${SUPABASE_URL}/functions/v1/admin-data`, {
    method: 'POST',
    headers: adminHeaders,
    body: adminBody('setBunnyConfig', { config: cfg }),
  });
  _cache = cfg;
}

export async function isStorageConfigured(): Promise<boolean> {
  const c = await getBunnyConfig();
  return !!(c.storageZone && c.storageKey && c.cdnUrl);
}

export async function isStreamConfigured(): Promise<boolean> {
  const c = await getBunnyConfig();
  return !!(c.streamLibraryId && c.streamApiKey);
}
