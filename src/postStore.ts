import type { Post } from './types';
import { SAMPLE_POSTS } from './samplePosts';
import { excerptFromMarkdown } from './markdown';

import { SUPABASE_URL, ANON_KEY } from './supabaseConfig';
import { getToken } from './adminAuth';

let _posts: Post[] | null = null;
let _loading: Promise<void> | null = null;

function dbRowToPost(row: Record<string, unknown>): Post {
  return {
    slug: row.slug as string,
    title: row.title as string,
    date: row.date as string,
    excerpt: row.excerpt as string,
    content: row.content as string,
    pinned: row.pinned as boolean,
    published: row.published as boolean | undefined,
    tags: row.tags as string[] ?? [],
    featuredImage: row.featured_image as string | undefined,
    socialTitle: row.social_title as string | undefined,
    socialDescription: row.social_description as string | undefined,
    socialImage: row.social_image as string | undefined,
    bunnyVideoId: row.bunny_video_id as string | undefined,
    bunnyAudioId: row.bunny_audio_id as string | undefined,
    bunnyLibraryId: row.bunny_library_id as string | undefined,
    bandcampTrackId: row.bandcamp_track_id as string | undefined,
    bandcampAlbumId: row.bandcamp_album_id as string | undefined,
  };
}

function postToDbRow(post: Post): Record<string, unknown> {
  return {
    slug: post.slug,
    title: post.title,
    date: post.date,
    excerpt: post.excerpt ?? '',
    content: post.content ?? '',
    pinned: post.pinned ?? false,
    published: post.published ?? true,
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
  };
}

function sortPosts(posts: Post[]): Post[] {
  return [...posts].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
}

export async function loadPosts(): Promise<void> {
  if (_loading) return _loading;
  const p = (async () => {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/posts?order=date.desc&select=*`,
        { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` } }
      );
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      const rows = await res.json() as Record<string, unknown>[];
      _posts = sortPosts(rows.map(dbRowToPost));
    } catch {
      _posts = [...SAMPLE_POSTS];
    } finally {
      _loading = null;
    }
  })();
  _loading = p;
  return p;
}

export function getAllPosts(): Post[] {
  return (_posts ? sortPosts([..._posts]) : [...SAMPLE_POSTS]).filter((p) => p.published !== false);
}

export function getAdminPosts(): Post[] {
  return _posts ? sortPosts([..._posts]) : [...SAMPLE_POSTS];
}

export function getPost(slug: string): Post | undefined {
  return getAllPosts().find((p) => p.slug === slug);
}

export function getPostAdmin(slug: string): Post | undefined {
  return getAdminPosts().find((p) => p.slug === slug);
}

export function getExcerpt(post: Post): string {
  return post.excerpt || excerptFromMarkdown(post.content);
}

export function getBandcampTrackId(post: Post): string | undefined {
  if (post.bandcampTrackId) return post.bandcampTrackId;
  const m = post.content.match(/^:::bandcamp-track\s+(\S+)/m);
  if (m) return m[1];
  const iframeMatch = post.content.match(/<iframe[^>]+src=["']https?:\/\/bandcamp\.com\/EmbeddedPlayer\/track=(\d+)/i);
  return iframeMatch ? iframeMatch[1] : undefined;
}

export function getBandcampAlbumId(post: Post): string | undefined {
  if (post.bandcampAlbumId) return post.bandcampAlbumId;
  const m = post.content.match(/^:::bandcamp-album\s+(\S+)/m);
  if (m) return m[1];
  const iframeMatch = post.content.match(/<iframe[^>]+src=["']https?:\/\/bandcamp\.com\/EmbeddedPlayer\/album=(\d+)/i);
  return iframeMatch ? iframeMatch[1] : undefined;
}

export function getBandcampEmbed(post: Post): { kind: 'track' | 'album'; id: string } | undefined {
  const trackId = getBandcampTrackId(post);
  if (trackId) return { kind: 'track', id: trackId };
  const albumId = getBandcampAlbumId(post);
  if (albumId) return { kind: 'album', id: albumId };
  return undefined;
}

export function getBunnyVideo(post: Post): { libraryId: string; videoId: string } | undefined {
  if (post.bunnyLibraryId && post.bunnyVideoId) {
    return { libraryId: post.bunnyLibraryId, videoId: post.bunnyVideoId };
  }
  const m = post.content.match(/^:::bunny-video\s+(\S+)\s+(\S+)/m);
  return m ? { libraryId: m[1], videoId: m[2] } : undefined;
}

export function hasBandcamp(post: Post): boolean {
  if (post.bandcampTrackId || post.bandcampAlbumId) return true;
  return /^:::bandcamp-(track|album)\s+\S+/m.test(post.content) ||
    /^https?:\/\/[^.]+\.bandcamp\.com\/(track|album)\/[^\s/?#]+\/?$/m.test(post.content) ||
    /<iframe[^>]+src=["']https?:\/\/bandcamp\.com\/EmbeddedPlayer\/(track|album)=\d+/i.test(post.content);
}

export function getMusicPosts(): Post[] {
  return getAllPosts().filter(hasBandcamp);
}

const VIDEO_EXT = /\.(mp4|webm|ogg|mov|m4v)(\?|$)/i;

export function hasVideo(post: Post): boolean {
  if (post.bunnyVideoId) return true;
  if (/^:::bunny-video\s+\S+\s+\S+/m.test(post.content)) return true;
  if (post.featuredImage && VIDEO_EXT.test(post.featuredImage)) return true;
  return /(^|\n)\s*(https?:\/\/\S+\.(mp4|webm|ogg|mov|m4v)(\?\S*)?)\s*($|\n)/i.test(post.content);
}

export function getVideoPosts(): Post[] {
  return getAllPosts().filter(hasVideo);
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function formatDateShort(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function getAllTags(): string[] {
  const tags = new Set<string>();
  getAllPosts().forEach((p) => p.tags?.forEach((t) => tags.add(t)));
  return Array.from(tags).sort();
}

export function getPostsByTag(tag: string): Post[] {
  return getAllPosts().filter((p) => p.tags?.includes(tag));
}

export function searchPosts(query: string): Post[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return getAllPosts().filter(
    (p) =>
      p.title.toLowerCase().includes(q) ||
      getExcerpt(p).toLowerCase().includes(q) ||
      p.tags?.some((t) => t.toLowerCase().includes(q))
  );
}

async function adminAction(action: string, payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-data`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
    body: JSON.stringify({ action, token, ...payload }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export async function updatePost(originalSlug: string, updates: Partial<Post>): Promise<boolean> {
  const existing = getPostAdmin(originalSlug);
  if (!existing) return false;
  const merged = { ...existing, ...updates };
  if (merged.slug !== originalSlug) {
    await adminAction('deletePost', { slug: originalSlug });
  }
  await adminAction('upsertPost', { post: postToDbRow(merged) });
  await loadPosts();
  return true;
}

export async function pinPost(slug: string): Promise<boolean> {
  if (!_posts) return false;
  for (const p of _posts) {
    const shouldPin = p.slug === slug;
    if (p.pinned !== shouldPin) {
      await adminAction('upsertPost', { post: postToDbRow({ ...p, pinned: shouldPin }) });
    }
  }
  await loadPosts();
  return true;
}

export async function unpinPost(slug: string): Promise<boolean> {
  return updatePost(slug, { pinned: false });
}

export async function togglePin(slug: string): Promise<boolean> {
  const post = getPostAdmin(slug);
  if (!post) return false;
  return post.pinned ? unpinPost(slug) : pinPost(slug);
}

export async function deletePost(slug: string): Promise<boolean> {
  await adminAction('deletePost', { slug });
  await loadPosts();
  return true;
}

export async function createPost(post: Post): Promise<boolean> {
  if (getPostAdmin(post.slug)) return false;
  await adminAction('upsertPost', { post: postToDbRow(post) });
  await loadPosts();
  return true;
}

export async function togglePublished(slug: string): Promise<boolean> {
  const post = getPostAdmin(slug);
  if (!post) return false;
  await updatePost(slug, { published: !post.published });
  return true;
}

export async function resetPosts(): Promise<void> {
  for (const p of SAMPLE_POSTS) {
    await adminAction('upsertPost', { post: postToDbRow(p) });
  }
  await loadPosts();
}
