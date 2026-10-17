const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const restHeaders: Record<string, string> = {
  "Content-Type": "application/json",
  apikey: serviceRoleKey,
  Authorization: `Bearer ${serviceRoleKey}`,
};

const SITE_URL = "https://www.betablacklotus.com";
const SITE_TITLE = "Beta Black Lotus";
const SITE_DESC = "A personal weblog. Notes, essays, and field recordings.";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

interface PostRow {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  content: string;
  featured_image?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/posts?published=eq.true&order=date.desc&select=slug,title,date,excerpt,content,featured_image`,
      { headers: restHeaders }
    );

    if (!res.ok) {
      return new Response("Internal error", {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
      });
    }

    const rows: PostRow[] = await res.json();

    const items = rows
      .map((post) => {
        const link = `${SITE_URL}/${post.slug}`;
        const pubDate = new Date(post.date).toUTCString();
        const excerpt = post.excerpt || post.content.slice(0, 200).replace(/\n/g, " ").trim();
        const desc = escapeXml(excerpt);
        const title = escapeXml(post.title);
        const guid = `terminal-${post.slug}`;
        let media = "";
        if (post.featured_image) {
          media = `    <media:content url="${escapeXml(post.featured_image)}" medium="image" />\n`;
        }
        return `    <item>
      <title>${title}</title>
      <link>${link}</link>
      <guid isPermaLink="false">${guid}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${desc}</description>
${media}    </item>`;
      })
      .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/feed.xsl"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${escapeXml(SITE_TITLE)}</title>
    <link>${SITE_URL}/</link>
    <description>${escapeXml(SITE_DESC)}</description>
    <language>en-us</language>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

    return new Response(xml, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(`Error: ${msg}`, {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "text/plain" },
    });
  }
});
