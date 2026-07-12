// Client-side RSS feed generator. Produces a valid RSS 2.0 XML string from
// the current posts. In a static export, the pre-built /feed.xml in public/
// is served as-is. This generator is useful for regenerating the feed after
// editing posts in the admin panel — download the result and replace feed.xml.

import { getAllPosts, getExcerpt } from './postStore';

const SITE_URL = 'https://www.betablacklotus.com';
const SITE_TITLE = 'Beta Black Lotus';
const SITE_DESC = 'A personal weblog. Notes, essays, and field recordings.';

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function generateRssFeed(): string {
  const posts = getAllPosts();
  const items = posts
    .map((post) => {
      const link = `${SITE_URL}/${post.slug}`;
      const pubDate = new Date(post.date).toUTCString();
      const desc = escapeXml(getExcerpt(post));
      const title = escapeXml(post.title);
      const guid = `terminal-${post.slug}`;
      let media = '';
      if (post.featuredImage) {
        media = `    <media:content url="${escapeXml(post.featuredImage)}" medium="image" />\n`;
      }
      return `    <item>
      <title>${title}</title>
      <link>${link}</link>
      <guid isPermaLink="false">${guid}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${desc}</description>
${media}    </item>`;
    })
    .join('\n');

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

export function downloadRssFeed(): void {
  const xml = generateRssFeed();
  const blob = new Blob([xml], { type: 'application/rss+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'feed.xml';
  a.click();
  URL.revokeObjectURL(url);
}
