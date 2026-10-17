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

const VIDEO_EXT = /\.(mp4|webm|ogg|mov|m4v)(\?|$)/i;

function isVideoUrl(url: string): boolean {
  return VIDEO_EXT.test(url);
}

function hasBandcamp(content: string): boolean {
  return /bandcamp\.com\/EmbeddedPlayer\/(track|album)=\d+/i.test(content)
    || /^:::bandcamp-(track|album)\s+\S+/m.test(content)
    || /^https?:\/\/[^.]+\.bandcamp\.com\/(track|album)\//m.test(content);
}

function hasBunnyVideo(content: string): boolean {
  return /^:::bunny-video\s+\S+\s+\S+/m.test(content);
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
        const medium = isVideoUrl(post.featured_image) ? "video" : "image";
        media = `    <media:content url="${escapeXml(post.featured_image)}" medium="${medium}" />\n`;
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
      let mediaPreview = "";
      if (post.featured_image && !isVideoUrl(post.featured_image)) {
        thumb = `<img class="item-thumb" src="${escapeHtml(post.featured_image)}" alt="${title}" />`;
      } else if (post.featured_image && isVideoUrl(post.featured_image)) {
        mediaPreview = `<div class="item-media-badge"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> Video</div>`;
      } else if (hasBandcamp(post.content)) {
        mediaPreview = `<div class="item-media-badge"><svg width="14" height="14" viewBox="0 0 100 100" fill="currentColor"><path d="M0 66.7L33.3 33.3H100L66.7 66.7z"/></svg> Bandcamp</div>`;
      } else if (hasBunnyVideo(post.content)) {
        mediaPreview = `<div class="item-media-badge"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> Video</div>`;
      }
      return `<div class="item">
  <div class="item-title"><a href="${escapeHtml(link)}">${title}</a></div>
  <div class="item-date">${escapeHtml(pubDate)}</div>
  <div class="item-desc">${desc}</div>
  ${thumb}
  ${mediaPreview}
</div>`;
    })
    .join("\n");

  const navLinks = [
    { label: "Home", path: "/" },
    { label: "Music", path: "/music" },
    { label: "Videos", path: "/videos" },
    { label: "EPK", path: "/EPK" },
    { label: "Contact", path: "/contact" },
  ];

  const navHtml = navLinks
    .map((l) => `<a href="${SITE_URL}${l.path === "/" ? "/" : l.path}" class="nav-link${l.label === "RSS" ? " active" : ""}">${l.label}</a>`)
    .join("\n          ");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>RSS — ${escapeHtml(SITE_TITLE)}</title>
<link rel="alternate" type="application/rss+xml" title="${escapeHtml(SITE_TITLE)}" href="${SITE_URL}/feed.xml" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,500&display=swap" rel="stylesheet" />
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  background: #ffffff;
  color: #1a1a1a;
  font-size: 16px;
  line-height: 1.65;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
a { color: #1a4e8a; text-decoration: underline; text-underline-offset: 2px; }
a:visited { color: #6a3d8f; }
a:hover { color: #8a1a1a; }
::selection { background: #1a1a1a; color: #ffffff; }

/* ── Site header ── */
.site-header {
  position: fixed; top: 0; left: 0; right: 0; z-index: 50;
  background: #ffffff; border-bottom: 1px solid #999999; height: 64px;
  display: flex; align-items: center;
}
.site-header-inner {
  max-width: 720px; margin: 0 auto; width: 100%;
  padding: 0 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px;
}
.site-logo {
  font-weight: 700; font-size: 1rem; letter-spacing: -0.02em;
  color: #1a1a1a; text-decoration: none; flex-shrink: 0;
}
.site-logo:hover { color: #1a1a1a; }
.site-nav { display: flex; align-items: center; gap: 20px; }
.nav-link {
  color: #1a1a1a; text-decoration: none; font-size: 14px;
  padding: 4px 0; border-bottom: 1px solid transparent;
  transition: border-color 0.1s linear;
}
.nav-link:hover { border-bottom-color: #1a1a1a; color: #1a1a1a; }
.nav-link.active { border-bottom-color: #1a1a1a; font-weight: 600; }

@media (max-width: 768px) {
  .site-nav { display: none; }
}

/* ── Page content ── */
.page-content {
  max-width: 640px; margin: 0 auto;
  padding: 96px 16px 48px;
}
.breadcrumb { font-size: 12px; color: #6b6657; margin-bottom: 24px; }
.breadcrumb a { color: #6b6657; text-decoration: none; }
.breadcrumb a:hover { color: #1a1a1a; }
.breadcrumb span { margin: 0 4px; }
.page-title {
  font-size: 1.5rem; font-weight: 600; line-height: 1.2; margin-bottom: 24px;
}
.feed-info {
  background: #ffffff; border: 1px solid #999999; padding: 16px 20px;
  margin-bottom: 32px; font-size: 13px; color: #6b6657; line-height: 1.7;
}
.feed-info strong { color: #1a1a1a; }
.feed-info code {
  background: #f0f0f0; padding: 1px 6px; font-size: 12px; border: 1px solid #999999;
}
.feed-url { word-break: break-all; }

/* ── Feed items ── */
.items { display: flex; flex-direction: column; }
.item { border-bottom: 1px solid #999999; padding: 20px 0; }
.item:first-child { padding-top: 0; }
.item:last-child { border-bottom: none; }
.item-title { font-size: 15px; font-weight: 600; margin-bottom: 4px; }
.item-title a { color: #1a1a1a; text-decoration: none; }
.item-title a:hover { color: #1a4e8a; text-decoration: underline; }
.item-date { font-size: 12px; color: #6b6657; margin-bottom: 8px; }
.item-desc { font-size: 13px; color: #6b6657; line-height: 1.6; }
.item-thumb {
  width: 100%; max-height: 180px; object-fit: cover;
  margin-top: 12px; border: 1px solid #999999; display: block;
}
.item-media-badge {
  display: inline-flex; align-items: center; gap: 6px; margin-top: 10px;
  font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em;
  color: #6b6657; border: 1px solid #999999; background: #ffffff; padding: 4px 10px;
}
</style>
</head>
<body>

<header class="site-header">
  <div class="site-header-inner">
    <a href="${SITE_URL}/" class="site-logo">Beta Black Lotus</a>
    <nav class="site-nav">
          ${navHtml}
          <a href="${SITE_URL}/feed.xml" class="nav-link active">RSS</a>
    </nav>
  </div>
</header>

<div class="page-content">
  <div class="breadcrumb">
    <a href="${SITE_URL}/">Home</a><span>/</span>RSS
  </div>
  <h1 class="page-title">RSS</h1>
  <div class="feed-info">
    <strong>This is an RSS feed.</strong>
    Copy the URL below and paste it into your favorite feed reader (NetNewsWire, Feedly, Inoreader, etc.) to subscribe and get new posts delivered automatically.
    <br /><br />
    <code class="feed-url">${SITE_URL}/feed.xml</code>
  </div>
  <div class="items">
${items}
  </div>
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
