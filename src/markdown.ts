// Lightweight markdown parser — no external dependencies.
// Supports: headings, bold, italic, links, images, inline code, code blocks,
// unordered/ordered lists, blockquotes, hr, galleries, Bunny Stream embeds,
// Bandcamp embeds (:::bandcamp-track ID), and Bandcamp link cards.

const VIDEO_EXT = /\.(mp4|webm|ogg|mov|m4v)(\?|$)/i;

function isVideoUrl(url: string): boolean {
  return VIDEO_EXT.test(url);
}

function isSafeUrl(url: string): boolean {
  return /^https:\/\//i.test(url);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function inlineFormat(text: string): string {
  let out = escapeHtml(text);
  // Images and videos: ![alt](url)
  out = out.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, url) => {
    if (!isSafeUrl(url)) return escapeHtml(`![${alt}](${url})`);
    if (isVideoUrl(url)) {
      return `<video src="${url}" controls preload="metadata" loading="lazy"></video>`;
    }
    return `<img src="${url}" alt="${alt}" loading="lazy" />`;
  });
  // Links: [text](url)
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => {
    const safe = isSafeUrl(url) ? url : '#';
    return `<a href="${safe}"${safe.startsWith('http') ? ' rel="noopener"' : ''}>${label}</a>`;
  });
  // Inline code: `code`
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
  // Bold: **text**
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // Italic: *text* (avoid matching ** which is bold)
  out = out.replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, '$1<em>$2</em>');
  return out;
}

export function renderMarkdown(md: string): string {
  const lines = md.split('\n');
  const html: string[] = [];
  let inList = false;
  let inOl = false;
  let inQuote = false;
  let inCode = false;
  let codeBuffer: string[] = [];
  let galleryBuffer: string[] = [];
  let inCarousel = false;
  let carouselBuffer: string[] = [];

  const flushGallery = () => {
    if (galleryBuffer.length > 0) {
      html.push(`<div class="gallery">${galleryBuffer.join('')}</div>`);
      galleryBuffer = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code block fence
    if (line.trim().startsWith('```')) {
      if (inCode) {
        html.push(`<pre><code>${escapeHtml(codeBuffer.join('\n'))}</code></pre>`);
        codeBuffer = [];
        inCode = false;
      } else {
        flushGallery();
        if (inList) { html.push(inOl ? '</ol>' : '</ul>'); inList = false; }
        if (inQuote) { html.push('</blockquote>'); inQuote = false; }
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      codeBuffer.push(line);
      continue;
    }

    // Carousel block: :::carousel ... ::: (consecutive image lines become a scroll strip)
    if (line.trim() === ':::carousel') {
      flushGallery();
      if (inList) { html.push(inOl ? '</ol>' : '</ul>'); inList = false; }
      if (inQuote) { html.push('</blockquote>'); inQuote = false; }
      inCarousel = true;
      continue;
    }
    if (inCarousel) {
      if (line.trim() === ':::') {
        const imgs = carouselBuffer
          .map((l) => l.match(/^!\[([^\]]*)\]\(([^)]+)\)\s*$/))
          .filter(Boolean)
          .filter((m) => isSafeUrl(m![2]))
          .map((m) => `<img src="${m![2]}" alt="${m![1]}" loading="lazy" />`);
        if (imgs.length > 0) {
          html.push(`<div class="gallery-carousel">${imgs.join('')}</div>`);
        }
        carouselBuffer = [];
        inCarousel = false;
      } else {
        carouselBuffer.push(line);
      }
      continue;
    }

    // Bandcamp iframe embed: pasted <iframe src="https://bandcamp.com/EmbeddedPlayer/track=ID/...">
    const bandcampIframeMatch = line.match(/<iframe[^>]+src=["'](https?:\/\/bandcamp\.com\/EmbeddedPlayer\/(track|album)=(\d+)[^"']*)["'][^>]*>/i);
    if (bandcampIframeMatch) {
      flushGallery();
      if (inList) { html.push(inOl ? '</ol>' : '</ul>'); inList = false; }
      if (inQuote) { html.push('</blockquote>'); inQuote = false; }
      const kind = bandcampIframeMatch[2];
      const id = bandcampIframeMatch[3];
      // Skip following <a> tag line that Bandcamp includes in embed snippets
      const nextLine = lines[i + 1];
      if (nextLine && /<a\s[^>]*href=["']https?:\/\/[^"']+\.bandcamp\.com\/(track|album)\//i.test(nextLine)) {
        i++;
      }
      html.push(
        `<div class="bandcamp-embed">` +
        `<iframe src="https://bandcamp.com/EmbeddedPlayer/${kind}=${id}/size=large/bgcol=ffffff/linkcol=0687f5/tracklist=false/transparent=true/" ` +
        `title="Bandcamp player" seamless loading="lazy"></iframe>` +
        `</div>`
      );
      continue;
    }

    // Bandcamp card: bare bandcamp.com track or album URL on its own line
    const bandcampMatch = line.trim().match(/^(https?:\/\/([^.]+)\.bandcamp\.com\/(track|album)\/([^\s/?#]+))\/?$/i);
    if (bandcampMatch) {
      flushGallery();
      if (inList) { html.push(inOl ? '</ol>' : '</ul>'); inList = false; }
      if (inQuote) { html.push('</blockquote>'); inQuote = false; }
      const url = escapeHtml(bandcampMatch[1]);
      const artist = bandcampMatch[2];
      const kind = bandcampMatch[3];
      const slug = bandcampMatch[4];
      const title = slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      html.push(
        `<a href="${url}" rel="noopener" target="_blank" class="bandcamp-card">` +
        `<span class="bandcamp-card-icon">` +
        `<svg width="16" height="16" viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M0 66.7L33.3 33.3H100L66.7 66.7z"/></svg>` +
        `</span>` +
        `<span class="bandcamp-card-body">` +
        `<span class="bandcamp-card-title">${escapeHtml(title)}</span>` +
        `<span class="bandcamp-card-meta">${escapeHtml(artist)} &middot; ${kind}</span>` +
        `</span>` +
        `<span class="bandcamp-card-cta">Listen &rarr;</span>` +
        `</a>`
      );
      continue;
    }

    // Bandcamp embedded player: :::bandcamp-track TRACK_ID
    const bandcampEmbedMatch = line.match(/^:::bandcamp-track\s+(\S+)/);
    if (bandcampEmbedMatch) {
      flushGallery();
      if (inList) { html.push(inOl ? '</ol>' : '</ul>'); inList = false; }
      if (inQuote) { html.push('</blockquote>'); inQuote = false; }
      const trackId = bandcampEmbedMatch[1];
      html.push(
        `<div class="bandcamp-embed">` +
        `<iframe src="https://bandcamp.com/EmbeddedPlayer/track=${trackId}/size=large/bgcol=ffffff/linkcol=0687f5/tracklist=false/transparent=true/" ` +
        `title="Bandcamp player" seamless loading="lazy"></iframe>` +
        `</div>`
      );
      continue;
    }

    // Bandcamp album player: :::bandcamp-album ALBUM_ID
    const bandcampAlbumMatch = line.match(/^:::bandcamp-album\s+(\S+)/);
    if (bandcampAlbumMatch) {
      flushGallery();
      if (inList) { html.push(inOl ? '</ol>' : '</ul>'); inList = false; }
      if (inQuote) { html.push('</blockquote>'); inQuote = false; }
      const albumId = bandcampAlbumMatch[1];
      html.push(
        `<div class="bandcamp-embed">` +
        `<iframe src="https://bandcamp.com/EmbeddedPlayer/album=${albumId}/size=large/bgcol=ffffff/linkcol=0687f5/tracklist=false/transparent=true/" ` +
        `title="Bandcamp album player" seamless loading="lazy"></iframe>` +
        `</div>`
      );
      continue;
    }

    // Bunny Stream video embed: :::bunny-video libraryId videoId
    const bunnyVideoMatch = line.match(/^:::bunny-video\s+(\S+)\s+(\S+)/);
    if (bunnyVideoMatch) {
      flushGallery();
      if (inList) { html.push(inOl ? '</ol>' : '</ul>'); inList = false; }
      if (inQuote) { html.push('</blockquote>'); inQuote = false; }
      const libId = bunnyVideoMatch[1];
      const vidId = bunnyVideoMatch[2];
      html.push(
        `<div class="bunny-embed media-protect">` +
        `<div class="bunny-video-wrap">` +
        `<iframe src="https://video.bunny.net/embed/${libId}/${vidId}" ` +
        `title="Bunny Stream video" allow="autoplay;fullscreen;picture-in-picture" ` +
        `allowfullscreen loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe>` +
        `</div></div>`
      );
      continue;
    }

    // Bunny Stream audio embed: :::bunny-audio libraryId audioId
    const bunnyAudioMatch = line.match(/^:::bunny-audio\s+(\S+)\s+(\S+)/);
    if (bunnyAudioMatch) {
      flushGallery();
      if (inList) { html.push(inOl ? '</ol>' : '</ul>'); inList = false; }
      if (inQuote) { html.push('</blockquote>'); inQuote = false; }
      const libId = bunnyAudioMatch[1];
      const audId = bunnyAudioMatch[2];
      html.push(
        `<div class="bunny-audio-wrap media-protect">` +
        `<iframe src="https://audio.bunny.net/embed/${libId}/${audId}" ` +
        `title="Bunny Stream audio" allow="autoplay" ` +
        `loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe>` +
        `</div>`
      );
      continue;
    }

    // Empty lines don't break an in-progress gallery group
    if (line.trim() === '') {
      continue;
    }

    // Video line: bare video URL on its own line
    const videoUrlMatch = line.match(/^(https?:\/\/\S+\.(mp4|webm|ogg|mov|m4v))(\?\S*)?$/i);
    if (videoUrlMatch) {
      if (!isSafeUrl(videoUrlMatch[1])) continue;
      flushGallery();
      if (inList) { html.push(inOl ? '</ol>' : '</ul>'); inList = false; }
      if (inQuote) { html.push('</blockquote>'); inQuote = false; }
      html.push(`<video src="${videoUrlMatch[1]}" controls preload="metadata" class="post-video"></video>`);
      continue;
    }

    // Gallery line: ![alt](url) on its own line — collect consecutive ones (images only)
    const galleryImgMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)\s*$/);
    if (galleryImgMatch && !isVideoUrl(galleryImgMatch[2]) && isSafeUrl(galleryImgMatch[2])) {
      if (inList) { html.push(inOl ? '</ol>' : '</ul>'); inList = false; }
      if (inQuote) { html.push('</blockquote>'); inQuote = false; }
      galleryBuffer.push(
        `<img src="${galleryImgMatch[2]}" alt="${galleryImgMatch[1]}" loading="lazy" />`
      );
      continue;
    } else {
      flushGallery();
    }

    // Headings
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      if (inList) { html.push(inOl ? '</ol>' : '</ul>'); inList = false; }
      if (inQuote) { html.push('</blockquote>'); inQuote = false; }
      const level = headingMatch[1].length;
      html.push(`<h${level}>${inlineFormat(headingMatch[2])}</h${level}>`);
      continue;
    }

    // Horizontal rule
    if (/^---+\s*$/.test(line) || /^\*\*\*+\s*$/.test(line)) {
      if (inList) { html.push(inOl ? '</ol>' : '</ul>'); inList = false; }
      if (inQuote) { html.push('</blockquote>'); inQuote = false; }
      html.push('<hr />');
      continue;
    }

    // Blockquote
    const quoteMatch = line.match(/^>\s?(.*)$/);
    if (quoteMatch) {
      if (inList) { html.push(inOl ? '</ol>' : '</ul>'); inList = false; }
      if (!inQuote) { html.push('<blockquote>'); inQuote = true; }
      html.push(`<p>${inlineFormat(quoteMatch[1])}</p>`);
      continue;
    } else if (inQuote) {
      html.push('</blockquote>');
      inQuote = false;
    }

    // Ordered list
    const olMatch = line.match(/^\d+\.\s+(.*)$/);
    if (olMatch) {
      if (inList && !inOl) { html.push('</ul>'); inList = false; }
      if (!inList) { html.push('<ol>'); inList = true; inOl = true; }
      html.push(`<li>${inlineFormat(olMatch[1])}</li>`);
      continue;
    }

    // Unordered list
    const ulMatch = line.match(/^[-*]\s+(.*)$/);
    if (ulMatch) {
      if (inList && inOl) { html.push('</ol>'); inList = false; }
      if (!inList) { html.push('<ul>'); inList = true; inOl = false; }
      html.push(`<li>${inlineFormat(ulMatch[1])}</li>`);
      continue;
    }

    // Close list if we hit a non-list line
    if (inList) {
      html.push(inOl ? '</ol>' : '</ul>');
      inList = false;
    }

    // Paragraph
    html.push(`<p>${inlineFormat(line)}</p>`);
  }

  // Close any open blocks
  flushGallery();
  if (inCode) html.push(`<pre><code>${escapeHtml(codeBuffer.join('\n'))}</code></pre>`);
  if (inCarousel && carouselBuffer.length > 0) {
    const imgs = carouselBuffer
      .map((l) => l.match(/^!\[([^\]]*)\]\(([^)]+)\)\s*$/))
      .filter(Boolean)
      .filter((m) => isSafeUrl(m![2]))
      .map((m) => `<img src="${m![2]}" alt="${m![1]}" loading="lazy" />`);
    if (imgs.length > 0) html.push(`<div class="gallery-carousel">${imgs.join('')}</div>`);
  }
  if (inList) html.push(inOl ? '</ol>' : '</ul>');
  if (inQuote) html.push('</blockquote>');

  return html.join('\n');
}

// Extract a plain-text excerpt from markdown (strip syntax)
export function excerptFromMarkdown(md: string, maxLen = 180): string {
  const plain = md
    .replace(/<iframe[^>]*>.*?<\/iframe>/gis, '')
    .replace(/^https?:\/\/[^\s]+\.bandcamp\.com\/[^\s]+$/gm, '')
    .replace(/^:::bandcamp-(track|album)\s+\S+$/gm, '')
    .replace(/^:::carousel$|^:::$/gm, '')
    .replace(/^:::bunny-(video|audio).*$/gm, '')
    .replace(/^https?:\/\/\S+\.(mp4|webm|ogg|mov|m4v)(\?\S*)?$/gim, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*`_>#-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return plain.length > maxLen ? plain.slice(0, maxLen).trim() + '…' : plain;
}
