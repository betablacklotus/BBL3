const CFG_KEY = 'bbl_bunny';

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

export function getBunnyConfig(): BunnyConfig {
  try {
    const raw = localStorage.getItem(CFG_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

export function setBunnyConfig(cfg: BunnyConfig): void {
  localStorage.setItem(CFG_KEY, JSON.stringify(cfg));
}

export function isStorageConfigured(): boolean {
  const c = getBunnyConfig();
  return !!(c.storageZone && c.storageKey && c.cdnUrl);
}

export function isStreamConfigured(): boolean {
  const c = getBunnyConfig();
  return !!(c.streamLibraryId && c.streamApiKey);
}
