const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const DEFAULT_PASSWORD = "ChangeMe!Str0ngP@ss";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const restHeaders: Record<string, string> = {
  "Content-Type": "application/json",
  apikey: serviceRoleKey,
  Authorization: `Bearer ${serviceRoleKey}`,
};

// ── Password hashing (PBKDF2 via Web Crypto) ──

async function hashPassword(password: string, saltBytes: Uint8Array): Promise<{ hash: string; salt: string }> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const derived = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: saltBytes, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    256
  );
  return { hash: bytesToBase64(new Uint8Array(derived)), salt: bytesToBase64(saltBytes) };
}

async function verifyPassword(password: string, storedHash: string, storedSalt: string): Promise<boolean> {
  const { hash } = await hashPassword(password, base64ToBytes(storedSalt));
  if (hash.length !== storedHash.length) return false;
  let result = 0;
  for (let i = 0; i < hash.length; i++) result |= hash.charCodeAt(i) ^ storedHash.charCodeAt(i);
  return result === 0;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// ── Helpers for talking to the Supabase REST API with the service key ──

async function fetchSettings(): Promise<Record<string, unknown>> {
  const res = await fetch(`${supabaseUrl}/rest/v1/site_settings?id=eq.1&select=*`, { headers: restHeaders });
  const data = await res.json();
  return data[0] ?? {};
}

async function patchSettings(patch: Record<string, unknown>): Promise<void> {
  await fetch(`${supabaseUrl}/rest/v1/site_settings?id=eq.1`, {
    method: "PATCH",
    headers: restHeaders,
    body: JSON.stringify({ ...patch, updated_at: new Date().toISOString() }),
  });
}

interface PostRow {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  content: string;
  pinned: boolean;
  tags: string[];
  featured_image?: string;
  social_title?: string;
  social_description?: string;
  social_image?: string;
  bunny_video_id?: string;
  bunny_audio_id?: string;
  bunny_library_id?: string;
  bandcamp_track_id?: string;
  bandcamp_album_id?: string;
}

interface PageRow {
  slug: string;
  title: string;
  content: string;
  excerpt?: string;
  featured_image?: string;
  social_title?: string;
  social_description?: string;
  social_image?: string;
  show_in_header: boolean;
  show_in_footer: boolean;
}

// ── Main handler ──

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action } = body;

    // ── Auth actions ──

    if (action === "login") {
      const settings = await fetchSettings();
      let hash = settings.admin_password_hash as string | undefined;
      let salt = settings.admin_password_salt as string | undefined;

      if (!hash || !salt || !settings.password_initialized) {
        const saltBytes = crypto.getRandomValues(new Uint8Array(16));
        const result = await hashPassword(DEFAULT_PASSWORD, saltBytes);
        hash = result.hash;
        salt = result.salt;
        await patchSettings({ admin_password_hash: hash, admin_password_salt: salt, password_initialized: true });
      }

      const valid = await verifyPassword(body.password, hash!, salt!);
      return json({ success: valid, message: valid ? "Login successful." : "Invalid password." });
    }

    if (action === "changePassword") {
      const settings = await fetchSettings();
      let hash = settings.admin_password_hash as string | undefined;
      let salt = settings.admin_password_salt as string | undefined;

      if (!hash || !salt || !settings.password_initialized) {
        const saltBytes = crypto.getRandomValues(new Uint8Array(16));
        const result = await hashPassword(DEFAULT_PASSWORD, saltBytes);
        hash = result.hash;
        salt = result.salt;
        await patchSettings({ admin_password_hash: hash, admin_password_salt: salt, password_initialized: true });
      }

      const valid = await verifyPassword(body.currentPassword, hash!, salt!);
      if (!valid) return json({ success: false, message: "Current password is incorrect." });

      const saltBytes = crypto.getRandomValues(new Uint8Array(16));
      const { hash: newHash, salt: newSalt } = await hashPassword(body.newPassword, saltBytes);
      await patchSettings({ admin_password_hash: newHash, admin_password_salt: newSalt });
      return json({ success: true, message: "Password changed." });
    }

    if (action === "isDefaultPassword") {
      // Always show the warning — safe default
      return json({ isDefault: true });
    }

    // ── Site settings ──

    if (action === "getSiteSettings") {
      const settings = await fetchSettings();
      return json({ tagline: settings.tagline ?? "We travel the spaceways from planet to planet." });
    }

    if (action === "setSiteSettings") {
      await patchSettings({ tagline: body.tagline });
      return json({ success: true });
    }

    // ── Bunny config ──

    if (action === "getBunnyConfig") {
      const settings = await fetchSettings();
      const cfg = settings.bunny_config as Record<string, unknown> | null;
      const defaults = {
        storageZone: "", storageKey: "", cdnUrl: "",
        storageHostname: "storage.bunnycdn.com",
        streamLibraryId: "", streamApiKey: "",
      };
      return json(cfg ? { ...defaults, ...cfg } : defaults);
    }

    if (action === "setBunnyConfig") {
      await patchSettings({ bunny_config: body.config });
      return json({ success: true });
    }

    // ── Posts CRUD ──

    if (action === "getPosts") {
      const res = await fetch(`${supabaseUrl}/rest/v1/posts?order=date.desc&select=*`, { headers: restHeaders });
      const rows: PostRow[] = await res.json();
      return json(rows.map(rowToPost));
    }

    if (action === "upsertPost") {
      const post = body.post;
      const row: Record<string, unknown> = {
        slug: post.slug,
        title: post.title,
        date: post.date,
        excerpt: post.excerpt ?? "",
        content: post.content ?? "",
        pinned: post.pinned ?? false,
        tags: post.tags ?? [],
        featured_image: post.featuredImage ?? null,
        social_title: post.socialTitle ?? null,
        social_description: post.socialDescription ?? null,
        social_image: post.socialImage ?? null,
        bunny_video_id: post.bunnyVideoId ?? null,
        bunny_audio_id: post.bunnyAudioId ?? null,
        bunny_library_id: post.bunnyLibraryId ?? null,
        bandcamp_track_id: post.bandcampTrackId ?? null,
        bandcamp_album_id: post.bandcampAlbumId ?? null,
        updated_at: new Date().toISOString(),
      };
      await fetch(`${supabaseUrl}/rest/v1/posts?on_conflict=slug`, {
        method: "POST",
        headers: { ...restHeaders, "Prefer": "resolution=merge-duplicates" },
        body: JSON.stringify(row),
      });
      return json({ success: true });
    }

    if (action === "deletePost") {
      await fetch(`${supabaseUrl}/rest/v1/posts?slug=eq.${encodeURIComponent(body.slug)}`, {
        method: "DELETE",
        headers: restHeaders,
      });
      return json({ success: true });
    }

    // ── Pages CRUD ──

    if (action === "getPages") {
      const res = await fetch(`${supabaseUrl}/rest/v1/pages?order=title.asc&select=*`, { headers: restHeaders });
      const rows: PageRow[] = await res.json();
      return json(rows.map(rowToPage));
    }

    if (action === "upsertPage") {
      const page = body.page;
      const row: Record<string, unknown> = {
        slug: page.slug,
        title: page.title,
        content: page.content ?? "",
        excerpt: page.excerpt ?? null,
        featured_image: page.featuredImage ?? null,
        social_title: page.socialTitle ?? null,
        social_description: page.socialDescription ?? null,
        social_image: page.socialImage ?? null,
        show_in_header: page.showInHeader ?? false,
        show_in_footer: page.showInFooter ?? false,
        updated_at: new Date().toISOString(),
      };
      await fetch(`${supabaseUrl}/rest/v1/pages?on_conflict=slug`, {
        method: "POST",
        headers: { ...restHeaders, "Prefer": "resolution=merge-duplicates" },
        body: JSON.stringify(row),
      });
      return json({ success: true });
    }

    if (action === "deletePage") {
      await fetch(`${supabaseUrl}/rest/v1/pages?slug=eq.${encodeURIComponent(body.slug)}`, {
        method: "DELETE",
        headers: restHeaders,
      });
      return json({ success: true });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return json({ error: msg }, 500);
  }
});

function json(data: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function rowToPost(r: PostRow): Record<string, unknown> {
  return {
    slug: r.slug,
    title: r.title,
    date: r.date,
    excerpt: r.excerpt,
    content: r.content,
    pinned: r.pinned,
    tags: r.tags ?? [],
    featuredImage: r.featured_image ?? undefined,
    socialTitle: r.social_title ?? undefined,
    socialDescription: r.social_description ?? undefined,
    socialImage: r.social_image ?? undefined,
    bunnyVideoId: r.bunny_video_id ?? undefined,
    bunnyAudioId: r.bunny_audio_id ?? undefined,
    bunnyLibraryId: r.bunny_library_id ?? undefined,
    bandcampTrackId: r.bandcamp_track_id ?? undefined,
    bandcampAlbumId: r.bandcamp_album_id ?? undefined,
  };
}

function rowToPage(r: PageRow): Record<string, unknown> {
  return {
    slug: r.slug,
    title: r.title,
    content: r.content,
    excerpt: r.excerpt ?? undefined,
    featuredImage: r.featured_image ?? undefined,
    socialTitle: r.social_title ?? undefined,
    socialDescription: r.social_description ?? undefined,
    socialImage: r.social_image ?? undefined,
    showInHeader: r.show_in_header,
    showInFooter: r.show_in_footer,
  };
}
