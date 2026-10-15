const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

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

export async function getBunnyConfig(): Promise<BunnyConfig> {
  if (_cache) return _cache;
  const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-data`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
    body: JSON.stringify({ action: 'getBunnyConfig' }),
  });
  if (!res.ok) return { ...DEFAULTS };
  const data: Record<string, unknown> = await res.json();
  _cache = { ...DEFAULTS, ...data };
  return _cache;
}

export async function setBunnyConfig(cfg: BunnyConfig): Promise<void> {
  await fetch(`${SUPABASE_URL}/functions/v1/admin-data`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
    body: JSON.stringify({ action: 'setBunnyConfig', config: cfg }),
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
