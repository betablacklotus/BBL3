import { isStorageConfigured } from './bunnyConfig';
import { SUPABASE_URL, ANON_KEY } from './supabaseConfig';
import { getToken } from './adminAuth';

export async function uploadImage(file: File): Promise<string> {
  const configured = await isStorageConfigured();
  if (!configured) {
    throw new Error(
      'Bunny Storage is not configured. Go to Admin → Settings to enter your Bunny credentials.'
    );
  }

  const token = getToken();
  if (!token) throw new Error('Not authenticated');

  const fileData = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });

  const res = await fetch(`${SUPABASE_URL}/functions/v1/bunny-upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ANON_KEY}`,
      apikey: ANON_KEY,
    },
    body: JSON.stringify({
      token,
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
