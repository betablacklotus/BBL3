import { getBunnyConfig, isStorageConfigured } from './bunnyConfig';

export async function uploadImage(file: File): Promise<string> {
  if (!isStorageConfigured()) {
    throw new Error(
      'Bunny Storage is not configured. Go to Admin → Settings to enter your Bunny credentials.'
    );
  }

  const { storageZone, storageKey, cdnUrl, storageHostname } = getBunnyConfig();
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase();
  const path = `${year}/${month}/${now.getTime()}-${safeName}`;

  const res = await fetch(`https://${storageHostname}/${storageZone}/${path}`, {
    method: 'PUT',
    headers: {
      AccessKey: storageKey,
      'Content-Type': file.type || 'application/octet-stream',
    },
    body: file,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Bunny upload failed (${res.status}): ${text}`);
  }

  return `${cdnUrl.replace(/\/$/, '')}/${path}`;
}
