import { SUPABASE_URL, ANON_KEY } from './supabaseConfig';
import { getToken } from './adminAuth';

export interface SiteSettings {
  siteTitle: string;
  tagline: string;
}

const DEFAULTS: SiteSettings = {
  siteTitle: 'Beta Black Lotus',
  tagline: 'We travel the spaceways from planet to planet.',
};

let cachedSettings: SiteSettings | null = null;
let pendingFetch: Promise<SiteSettings> | null = null;

const adminHeaders: Record<string, string> = {
  'Content-Type': 'application/json',
  apikey: ANON_KEY,
  Authorization: `Bearer ${ANON_KEY}`,
};

export async function getSiteSettings(): Promise<SiteSettings> {
  if (cachedSettings) return cachedSettings;
  if (!pendingFetch) {
    pendingFetch = (async () => {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-data`, {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({ action: 'getSiteSettings' }),
      });
      if (!res.ok) return { ...DEFAULTS };
      const data = await res.json();
      const settings = { tagline: data.tagline ?? DEFAULTS.tagline, siteTitle: data.siteTitle ?? DEFAULTS.siteTitle };
      cachedSettings = settings;
      return settings;
    })();
  }
  return pendingFetch;
}

export function getCachedSiteSettings(): SiteSettings | null {
  return cachedSettings;
}

export async function setSiteSettings(settings: SiteSettings): Promise<void> {
  await fetch(`${SUPABASE_URL}/functions/v1/admin-data`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({ action: 'setSiteSettings', tagline: settings.tagline, token: getToken() }),
  });
  cachedSettings = { ...settings };
}
