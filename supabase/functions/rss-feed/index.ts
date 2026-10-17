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

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

interface PostRow {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  content: string;
  featured_image?: string;
}

function fetchPosts(): Promise<Response> {
  return fetch(
    `${supabaseUrl}/rest/v1/posts?published=eq.true&order=date.desc&select=slug,title,date,excerpt,content,featured_image`,
    { headers: restHeaders }
  );
}

function buildXml(rows: PostRow[]): string {
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

  return `<?xml version="1.0" encoding="UTF-8"?>
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
}

function buildHtml(rows: PostRow[]): string {
  const items = rows
    .map((post) => {
      const link = `${SITE_URL}/${post.slug}`;
      const pubDate = new Date(post.date).toUTCString();
      const excerpt = post.excerpt || post.content.slice(0, 200).replace(/\n/g, " ").trim();
      const title = escapeHtml(post.title);
      const desc = escapeHtml(excerpt);
      let thumb = "";
      if (post.featured_image) {
        thumb = `<img class="item-thumb" src="${escapeHtml(post.featured_image)}" alt="${title}" />`;
      }
      return `<div class="item">
  <div class="item-title"><a href="${escapeHtml(link)}">${title}</a></div>
  <div class="item-date">${escapeHtml(pubDate)}</div>
  <div class="item-desc">${desc}</div>
  ${thumb}
</div>`;
    })
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(SITE_TITLE)} — RSS Feed</title>
<link rel="alternate" type="application/rss+xml" title="${escapeHtml(SITE_TITLE)}" href="${SITE_URL}/feed.xml" />
<style>
:root {
  --bg: #f5f5f0;
  --paper: #ffffff;
  --ink: #1a1a1a;
  --muted: #6b6657;
  --border: #d9d6ce;
  --accent: #1a4e8a;
  --mono: 'IBM Plex Mono', 'Courier New', monospace;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: var(--mono);
  background: var(--bg);
  color: var(--ink);
  line-height: 1.6;
  padding: 0 16px 48px;
}
.header {
  max-width: 640px;
  margin: 0 auto;
  padding: 48px 0 32px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 32px;
}
.badge {
  display: inline-block;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--muted);
  border: 1px solid var(--border);
  padding: 3px 10px;
  margin-bottom: 16px;
}
h1 {
  font-size: 1.6rem;
  font-weight: 600;
  margin-bottom: 8px;
}
.header p {
  color: var(--muted);
  font-size: 14px;
}
.info {
  background: var(--paper);
  border: 1px solid var(--border);
  padding: 16px 20px;
  margin-bottom: 32px;
  font-size: 13px;
  color: var(--muted);
  line-height: 1.7;
}
.info strong { color: var(--ink); }
.info code {
  background: var(--bg);
  padding: 1px 6px;
  font-size: 12px;
  border: 1px solid var(--border);
}
.feed-url {
  word-break: break-all;
}
.items {
  max-width: 640px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 0;
}
.item {
  border-bottom: 1px solid var(--border);
  padding: 20px 0;
}
.item:first-child { padding-top: 0; }
.item:last-child { border-bottom: none; }
.item-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 4px;
}
.item-title a {
  color: var(--ink);
  text-decoration: none;
}
.item-title a:hover {
  color: var(--accent);
  text-decoration: underline;
}
.item-date {
  font-size: 12px;
  color: var(--muted);
  margin-bottom: 8px;
}
.item-desc {
  font-size: 13px;
  color: var(--muted);
  line-height: 1.6;
}
.item-thumb {
  width: 100%;
  max-height: 180px;
  object-fit: cover;
  margin-top: 12px;
  border: 1px solid var(--border);
  display: block;
}
@media (max-width: 480px) {
  h1 { font-size: 1.3rem; }
  .header { padding-top: 32px; }
}
</style>
</head>
<body>
<div class="header">
  <span class="badge">RSS Feed</span>
  <h1>${escapeHtml(SITE_TITLE)}</h1>
  <p>${escapeHtml(SITE_DESC)}</p>
</div>
<div class="info">
  <strong>This is an RSS feed.</strong>
  Copy the URL below and paste it into your favorite feed reader (NetNewsWire, Feedly, Inoreader, etc.) to subscribe and get new posts delivered automatically.
  <br /><br />
  <code class="feed-url">${SITE_URL}/feed.xml</code>
</div>
<div class="items">
${items}
</div>
</body>
</html>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const wantsHtml = url.searchParams.get("format") === "html";

    const res = await fetchPosts();
    if (!res.ok) {
      return new Response("Internal error", {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
      });
    }

    const rows: PostRow[] = await res.json();

    if (wantsHtml) {
      const html = buildHtml(rows);
      return new Response(html, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    const xml = buildXml(rows);
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
