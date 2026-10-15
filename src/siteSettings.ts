const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export interface SiteSettings {
  tagline: string;
}

const DEFAULTS: SiteSettings = {
  tagline: 'We travel the spaceways from planet to planet.',
};

export async function getSiteSettings(): Promise<SiteSettings> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/site_settings?id=eq.1&select=tagline`, {
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
    },
  });
  if (!res.ok) return { ...DEFAULTS };
  const data = await res.json();
  if (data.length === 0) return { ...DEFAULTS };
  return { tagline: data[0].tagline ?? DEFAULTS.tagline };
}

export async function setSiteSettings(settings: SiteSettings): Promise<void> {
  await fetch(`${SUPABASE_URL}/functions/v1/admin-data`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ANON_KEY}` },
    body: JSON.stringify({ action: 'setSiteSettings', tagline: settings.tagline }),
  });
}
