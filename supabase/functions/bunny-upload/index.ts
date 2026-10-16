const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const jwtSecret = serviceRoleKey;

const restHeaders: Record<string, string> = {
  "Content-Type": "application/json",
  apikey: serviceRoleKey,
  Authorization: `Bearer ${serviceRoleKey}`,
};

// ── JWT verification (shared logic with admin-data) ──

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function verifyJwt(token: string): Promise<boolean> {
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [headerB64, payloadB64, sigB64] = parts;
  const data = `${headerB64}.${payloadB64}`;
  const restore = (s: string) => s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - s.length % 4) % 4);
  const sigBytes = base64ToBytes(restore(sigB64));
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(jwtSecret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
  const valid = await crypto.subtle.verify("HMAC", key, sigBytes, enc.encode(data));
  if (!valid) return false;
  const payload = JSON.parse(new TextDecoder().decode(base64ToBytes(restore(payloadB64)))) as Record<string, unknown>;
  const now = Math.floor(Date.now() / 1000);
  return typeof payload.exp === "number" && now < payload.exp;
}

async function fetchSettings(): Promise<Record<string, unknown>> {
  const res = await fetch(`${supabaseUrl}/rest/v1/site_settings?id=eq.1&select=*`, { headers: restHeaders });
  const data = await res.json();
  return data[0] ?? {};
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();

    // Verify admin JWT
    const token = body.token as string | undefined;
    if (!token || !(await verifyJwt(token))) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch Bunny credentials from server-side settings, not from the client
    const settings = await fetchSettings();
    const cfg = settings.bunny_config as Record<string, unknown> | null;
    if (!cfg) {
      return new Response(JSON.stringify({ error: "Bunny Storage is not configured" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const storageZone = cfg.storageZone as string;
    const storageKey = cfg.storageKey as string;
    const storageHostname = (cfg.storageHostname as string || "storage.bunnycdn.com")
      .replace(/^https?:\/\//i, "")
      .replace(/\/.*$/, "");
    const cdnUrl = cfg.cdnUrl as string;

    if (!storageZone || !storageKey || !cdnUrl) {
      return new Response(JSON.stringify({ error: "Bunny Storage is not configured" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { fileName, contentType, fileData } = body;
    if (!fileName || !fileData) {
      return new Response(JSON.stringify({ error: "Missing fileName or fileData" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, "0");
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_").toLowerCase();
    const path = `${year}/${month}/${now.getTime()}-${safeName}`;

    // Convert base64 back to binary
    const binaryString = atob(fileData);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const bunnyRes = await fetch(
      `https://${storageHostname}/${storageZone}/${path}`,
      {
        method: "PUT",
        headers: {
          AccessKey: storageKey,
          "Content-Type": contentType || "application/octet-stream",
        },
        body: bytes,
      },
    );

    if (!bunnyRes.ok) {
      const text = await bunnyRes.text().catch(() => bunnyRes.statusText);
      return new Response(
        JSON.stringify({ error: `Bunny upload failed (${bunnyRes.status}): ${text}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        url: `${cdnUrl.replace(/\/$/, "")}/${path}`,
        path,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
