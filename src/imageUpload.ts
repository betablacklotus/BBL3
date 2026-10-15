import { getBunnyConfig, isStorageConfigured } from './bunnyConfig';

export async function uploadImage(file: File): Promise<string> {
  const configured = await isStorageConfigured();
  if (!configured) {
    throw new Error(
      'Bunny Storage is not configured. Go to Admin → Settings to enter your Bunny credentials.'
    );
  }

  const { storageZone, storageKey, cdnUrl, storageHostname } = await getBunnyConfig();

  const fileData = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const res = await fetch(`${supabaseUrl}/functions/v1/bunny-upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${anonKey}`,
    },
    body: JSON.stringify({
      storageZone,
      storageKey,
      storageHostname,
      cdnUrl,
      fileName: file.name,
      contentType: file.type || 'application/octet-stream',
      fileData,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `Upload failed (${res.status})`);
  }

  const data = await res.json();
  return data.url;
}
