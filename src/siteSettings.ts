import { SUPABASE_URL, ANON_KEY } from './supabaseConfig';

export interface SiteSettings {
  tagline: string;
}

const DEFAULTS: SiteSettings = {
  tagline: 'We travel the spaceways from planet to planet.',
};

export async function getSiteSettings(): Promise<SiteSettings> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-data`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
    body: JSON.stringify({ action: 'getSiteSettings' }),
  });
  if (!res.ok) return { ...DEFAULTS };
  const data = await res.json();
  return { tagline: data.tagline ?? DEFAULTS.tagline };
}

export async function setSiteSettings(settings: SiteSettings): Promise<void> {
  await fetch(`${SUPABASE_URL}/functions/v1/admin-data`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
    body: JSON.stringify({ action: 'setSiteSettings', tagline: settings.tagline }),
  });
}
