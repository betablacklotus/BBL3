import { useEffect, useRef, useState, useCallback } from 'react';
import { PostCard } from '../components/PostCard';
import { getAllPosts } from '../postStore';
import { useMeta } from '../seo';

const PAGE_SIZE = 3;

export function HomePage() {
  useMeta({
    title: '',
    description: 'A personal weblog. Notes, essays, and field recordings.',
    type: 'website',
  });

  const allPosts = getAllPosts();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const hasMore = visibleCount < allPosts.length;

  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;
    setLoading(true);
    // small delay so the loading state is visible
    setTimeout(() => {
      setVisibleCount((c) => Math.min(c + PAGE_SIZE, allPosts.length));
      setLoading(false);
    }, 150);
  }, [loading, hasMore, allPosts.length]);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          loadMore();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore, hasMore, loading]);

  const visiblePosts = allPosts.slice(0, visibleCount);

  return (
    <div className="max-w-prose mx-auto px-4 sm:px-6">
      {/* Intro */}
      <div className="pt-10 pb-6 border-b rule">
        <h1 className="text-2xl sm:text-3xl font-semibold mb-2">Beta Black Lotus</h1>
        <p className="text-sm sm:text-base text-muted">
          "We travel the spaceways from planet to planet."
        </p>
      </div>

      {/* Posts */}
      <div>
        {visiblePosts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>

      {/* Sentinel for infinite scroll */}
      {hasMore && <div ref={sentinelRef} style={{ height: 1 }} />}

      {/* Load More fallback */}
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
    </div>
  );
}
