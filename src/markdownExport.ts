import type { Post } from './types';

function fmLine(key: string, value: string | undefined): string {
  return `${key}: ${value ?? ''}`;
}

export function postToMarkdown(post: Post): string {
  const fm = [
    '---',
    fmLine('title', post.title),
    fmLine('slug', post.slug),
    fmLine('date', post.date),
    fmLine('excerpt', post.excerpt),
    fmLine('tags', (post.tags ?? []).join(', ')),
    fmLine('pinned', String(!!post.pinned)),
    fmLine('featuredImage', post.featuredImage),
    fmLine('bandcampTrackId', post.bandcampTrackId),
    fmLine('bandcampAlbumId', post.bandcampAlbumId),
    fmLine('bunnyLibraryId', post.bunnyLibraryId),
    fmLine('bunnyVideoId', post.bunnyVideoId),
    fmLine('bunnyAudioId', post.bunnyAudioId),
    fmLine('socialTitle', post.socialTitle),
    fmLine('socialDescription', post.socialDescription),
    fmLine('socialImage', post.socialImage),
    '---',
  ].join('\n');
  return `${fm}\n\n${post.content}`;
}

export function downloadPostAsMarkdown(post: Post): void {
  const blob = new Blob([postToMarkdown(post)], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${post.slug}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

export function markdownToPost(content: string): Partial<Post> | null {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return null;

  const [, fm, body] = match;
  const post: Partial<Post> = { content: body.trim() };

  for (const line of fm.split(/\r?\n/)) {
    const colon = line.indexOf(':');
    if (colon < 0) continue;
    const key = line.slice(0, colon).trim();
    const val = line.slice(colon + 1).trim();
    if (!val) continue;

    switch (key) {
      case 'title':             post.title = val; break;
      case 'slug':              post.slug = val; break;
      case 'date':              post.date = val; break;
      case 'excerpt':           post.excerpt = val; break;
      case 'tags':              post.tags = val.split(',').map(t => t.trim()).filter(Boolean); break;
      case 'pinned':            post.pinned = val === 'true'; break;
      case 'featuredImage':     post.featuredImage = val; break;
      case 'bandcampTrackId':   post.bandcampTrackId = val; break;
      case 'bandcampAlbumId':   post.bandcampAlbumId = val; break;
      case 'bunnyLibraryId':    post.bunnyLibraryId = val; break;
      case 'bunnyVideoId':      post.bunnyVideoId = val; break;
      case 'bunnyAudioId':      post.bunnyAudioId = val; break;
      case 'socialTitle':       post.socialTitle = val; break;
      case 'socialDescription': post.socialDescription = val; break;
      case 'socialImage':       post.socialImage = val; break;
    }
  }

  return (post.title && post.slug) ? post : null;
}
