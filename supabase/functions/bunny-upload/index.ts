const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  // Edge function: bunny-upload
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { storageZone, storageKey, storageHostname, cdnUrl, fileName, contentType, fileData } =
      await req.json();

    if (!storageZone || !storageKey || !storageHostname || !cdnUrl || !fileName || !fileData) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
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

    const cleanHostname = storageHostname
      .replace(/^https?:\/\//i, "")
      .replace(/\/.*$/, "");

    const bunnyRes = await fetch(
      `https://${cleanHostname}/${storageZone}/${path}`,
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
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
