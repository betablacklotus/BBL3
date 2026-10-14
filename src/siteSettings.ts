const SETTINGS_KEY = 'bbl_site_settings';

export interface SiteSettings {
  tagline: string;
}

const DEFAULTS: SiteSettings = {
  tagline: 'We travel the spaceways from planet to planet.',
};

export function getSiteSettings(): SiteSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

export function setSiteSettings(settings: SiteSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
