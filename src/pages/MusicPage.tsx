import { useEffect, useRef, useState, useCallback } from 'react';
import { PostCard } from '../components/PostCard';
import { getMusicPosts } from '../postStore';
import { useMeta } from '../seo';

const PAGE_SIZE = 3;

export function MusicPage() {
  useMeta({ title: 'Music', description: 'Posts featuring Bandcamp music embeds.' });

  const allPosts = getMusicPosts();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const hasMore = visibleCount < allPosts.length;

  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;
    setLoading(true);
    setTimeout(() => {
      setVisibleCount((c) => Math.min(c + PAGE_SIZE, allPosts.length));
      setLoading(false);
    }, 150);
  }, [loading, hasMore, allPosts.length]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting && !loading) loadMore(); },
      { rootMargin: '200px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore, hasMore, loading]);

  const visiblePosts = allPosts.slice(0, visibleCount);

  return (
    <div className="max-w-prose mx-auto px-4 sm:px-6">
      <div className="pt-10 pb-6 border-b rule">
        <h1 className="text-2xl sm:text-3xl font-semibold">Music</h1>
      </div>

      {allPosts.length === 0 ? (
        <p className="text-muted text-sm pt-8">
          Posts with Bandcamp embeds will appear here automatically.
        </p>
      ) : (
        <>
          <div>
            {visiblePosts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>

          {hasMore && <div ref={sentinelRef} style={{ height: 1 }} />}

          {hasMore && (
            <div className="py-10 flex flex-col items-center gap-3">
              <button onClick={loadMore} disabled={loading} className="btn">
                {loading ? 'Loading…' : 'Load More'}
              </button>
              <p className="text-xs text-muted">
                {visibleCount} of {allPosts.length} posts
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
