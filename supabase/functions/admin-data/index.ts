const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const DEFAULT_PASSWORD = "ChangeMe!Str0ngP@ss";
const TOKEN_TTL = 2 * 60 * 60; // 2 hours in seconds

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// Use the service role key as the JWT signing secret — it's already secret and server-only.
const jwtSecret = serviceRoleKey;

const restHeaders: Record<string, string> = {
  "Content-Type": "application/json",
  apikey: serviceRoleKey,
  Authorization: `Bearer ${serviceRoleKey}`,
};

// ── JWT (HMAC-SHA256) ──

function base64UrlEncode(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlEncodeStr(s: string): string {
  return base64UrlEncode(new TextEncoder().encode(s));
}

async function signJwt(payload: Record<string, unknown>): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const enc = new TextEncoder();
  const data = `${base64UrlEncodeStr(JSON.stringify(header))}.${base64UrlEncodeStr(JSON.stringify(payload))}`;
  const key = await crypto.subtle.importKey("raw", enc.encode(jwtSecret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
  return `${data}.${base64UrlEncode(sig)}`;
}

async function verifyJwt(token: string): Promise<Record<string, unknown> | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [headerB64, payloadB64, sigB64] = parts;
  const data = `${headerB64}.${payloadB64}`;

  // Restore base64 from base64url
  const restore = (s: string) => s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - s.length % 4) % 4);
  const sigBytes = base64ToBytes(restore(sigB64));

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(jwtSecret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
  const valid = await crypto.subtle.verify("HMAC", key, sigBytes, enc.encode(data));
  if (!valid) return null;

  const payload = JSON.parse(new TextDecoder().decode(base64ToBytes(restore(payloadB64)))) as Record<string, unknown>;
  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== "number" || now >= payload.exp) return null;
  return payload;
}

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

// ── Server-side rate limiting ──

const MAX_ATTEMPTS = 5;
const LOCK_DURATION = 30 * 60 * 1000; // 30 minutes
const MAX_IP_ATTEMPTS = 10;
const IP_BLOCK_DURATION = 60 * 60 * 1000; // 1 hour

function getClientIp(req: Request): string {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}

async function recordLoginAttempt(ip: string, success: boolean): Promise<void> {
  await fetch(`${supabaseUrl}/rest/v1/login_attempts`, {
    method: "POST",
    headers: { ...restHeaders, "Prefer": "return=minimal" },
    body: JSON.stringify({ ip, success }),
  });
}

async function getRecentFailedAttempts(ip: string): Promise<number> {
  const since = new Date(Date.now() - LOCK_DURATION).toISOString();
  const res = await fetch(
    `${supabaseUrl}/rest/v1/login_attempts?select=id&ip=eq.${encodeURIComponent(ip)}&success=eq.false&created_at=gte.${since}`,
    { headers: restHeaders }
  );
  const rows = await res.json() as unknown[];
  return rows.length;
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

// ── Actions that require authentication ──

const AUTH_ACTIONS = new Set([
  "getPosts", "upsertPost", "deletePost",
  "getPages", "upsertPage", "deletePage",
  "setSiteSettings",
  "getBunnyConfig", "setBunnyConfig",
  "changePassword",
]);

interface PostRow {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  content: string;
  pinned: boolean;
  published: boolean;
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

    // ── Auth gate for privileged actions ──

    if (AUTH_ACTIONS.has(action)) {
      const token = body.token as string | undefined;
      if (!token) return json({ error: "Authentication required" }, 401);
      const payload = await verifyJwt(token);
      if (!payload) return json({ error: "Invalid or expired session" }, 401);
    }

    // ── Auth actions ──

    if (action === "login") {
      const ip = getClientIp(req);
      const failCount = await getRecentFailedAttempts(ip);
      if (failCount >= MAX_IP_ATTEMPTS) {
        return json({ success: false, message: "Too many failed attempts from this IP. Try again later." });
      }

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
      await recordLoginAttempt(ip, valid);

      if (!valid) {
        const nowFails = failCount + 1;
        if (nowFails >= MAX_ATTEMPTS) {
          return json({ success: false, message: "Too many failed attempts. Account locked for 30 minutes." });
        }
        return json({ success: false, message: `Invalid password. ${MAX_ATTEMPTS - nowFails} attempt(s) remaining.` });
      }

      const token = await signJwt({
        role: "admin",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + TOKEN_TTL,
      });

      const changedFromDefault = settings.password_changed_from_default === true;

      return json({ success: true, message: "Login successful.", token, mustChangePassword: !changedFromDefault });
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
      await patchSettings({ admin_password_hash: newHash, admin_password_salt: newSalt, password_changed_from_default: true });
      return json({ success: true, message: "Password changed." });
    }

    if (action === "isDefaultPassword") {
      const settings = await fetchSettings();
      return json({ isDefault: settings.password_changed_from_default !== true });
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
        published: post.published ?? true,
        tags: post.tags ?? [],
        featured_image: post.featured_image ?? null,
        social_title: post.social_title ?? null,
        social_description: post.social_description ?? null,
        social_image: post.social_image ?? null,
        bunny_video_id: post.bunny_video_id ?? null,
        bunny_audio_id: post.bunny_audio_id ?? null,
        bunny_library_id: post.bunny_library_id ?? null,
        bandcamp_track_id: post.bandcamp_track_id ?? null,
        bandcamp_album_id: post.bandcamp_album_id ?? null,
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
        featured_image: page.featured_image ?? null,
        social_title: page.social_title ?? null,
        social_description: page.social_description ?? null,
        social_image: page.social_image ?? null,
        show_in_header: page.show_in_header ?? false,
        show_in_footer: page.show_in_footer ?? false,
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
    published: r.published,
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
