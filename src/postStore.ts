import type { Post } from './types';
import { SAMPLE_POSTS } from './samplePosts';
import { excerptFromMarkdown } from './markdown';

const STORAGE_KEY = 'terminal_blog_posts_v1';

// Repairs known broken image URLs that may be persisted in localStorage.
function migratePosts(posts: Post[]): Post[] {
  const BROKEN = 'pexels-photo-2406467';
  const FIXED = 'https://images.pexels.com/photos/1005014/pexels-photo-1005014.jpeg?auto=compress&cs=tinysrgb&w=1200';
  return posts.map((p) => {
    if (!p.featuredImage?.includes(BROKEN)) return p;
    return { ...p, featuredImage: FIXED, socialImage: FIXED };
  });
}

function loadPosts(): Post[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Post[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        let migrated = migratePosts(parsed);
        // Merge in any sample posts that are missing from the stored list
        // (handles cases where new posts are added to samplePosts.ts after first load)
        const storedSlugs = new Set(migrated.map((p) => p.slug));
        const newSamples = SAMPLE_POSTS.filter((p) => !storedSlugs.has(p.slug));
        if (newSamples.length > 0) {
          migrated = [...migrated, ...newSamples];
          localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        } else if (JSON.stringify(migrated) !== stored) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        }
        return migrated;
      }
    }
  } catch {
    // fall through to defaults
  }
  return [...SAMPLE_POSTS];
}

function savePosts(posts: Post[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  } catch {
    // storage may be full or unavailable; non-fatal
  }
}

let _posts: Post[] | null = null;

export function getAllPosts(): Post[] {
  if (!_posts) _posts = loadPosts();
  // sort: pinned first, then by date desc
  return [..._posts].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
}

export function getPost(slug: string): Post | undefined {
  return getAllPosts().find((p) => p.slug === slug);
}

export function getExcerpt(post: Post): string {
  return post.excerpt || excerptFromMarkdown(post.content);
}

export function getBandcampTrackId(post: Post): string | undefined {
  if (post.bandcampTrackId) return post.bandcampTrackId;
  const m = post.content.match(/^:::bandcamp-track\s+(\S+)/m);
  return m ? m[1] : undefined;
}

export function getBandcampAlbumId(post: Post): string | undefined {
  if (post.bandcampAlbumId) return post.bandcampAlbumId;
  const m = post.content.match(/^:::bandcamp-album\s+(\S+)/m);
  return m ? m[1] : undefined;
}

// Returns the first available Bandcamp embed: track takes priority over album.
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
    /^https?:\/\/[^.]+\.bandcamp\.com\/(track|album)\/[^\s/?#]+\/?$/m.test(post.content);
}

export function getMusicPosts(): Post[] {
  return getAllPosts().filter(hasBandcamp);
}

export function hasVideo(post: Post): boolean {
  if (post.bunnyVideoId) return true;
  return /^:::bunny-video\s+\S+\s+\S+/m.test(post.content);
}

export function getVideoPosts(): Post[] {
  return getAllPosts().filter(hasVideo);
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
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

// Admin mutations
export function updatePost(slug: string, updates: Partial<Post>): boolean {
  const posts = getAllPosts();
  const idx = posts.findIndex((p) => p.slug === slug);
  if (idx === -1) return false;
  posts[idx] = { ...posts[idx], ...updates };
  _posts = posts;
  savePosts(posts);
  return true;
}

export function pinPost(slug: string): boolean {
  if (!_posts) _posts = loadPosts();
  // unpin all, then pin the target
  _posts = _posts.map((p) => ({ ...p, pinned: p.slug === slug ? true : false }));
  savePosts(_posts);
  return true;
}

export function unpinPost(slug: string): boolean {
  return updatePost(slug, { pinned: false });
}

export function togglePin(slug: string): boolean {
  const post = getPost(slug);
  if (!post) return false;
  return post.pinned ? unpinPost(slug) : pinPost(slug);
}

export function deletePost(slug: string): boolean {
  const posts = getAllPosts().filter((p) => p.slug !== slug);
  _posts = posts;
  savePosts(posts);
  return true;
}

export function createPost(post: Post): boolean {
  const posts = getAllPosts();
  if (posts.some((p) => p.slug === post.slug)) return false;
  posts.push(post);
  _posts = posts;
  savePosts(posts);
  return true;
}

export function resetPosts(): void {
  _posts = [...SAMPLE_POSTS];
  savePosts(_posts);
}
