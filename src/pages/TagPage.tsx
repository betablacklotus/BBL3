import { PostCard } from '../components/PostCard';
import { getPostsByTag } from '../postStore';
import { useMeta } from '../seo';

interface TagPageProps {
  tag: string;
}

export function TagPage({ tag }: TagPageProps) {
  useMeta({ title: `#${tag}`, description: `Posts tagged "${tag}".` });
  const posts = getPostsByTag(tag);

  return (
    <div className="max-w-prose mx-auto px-4 sm:px-6 pt-8 sm:pt-10 pb-20">
      <header className="border-b rule pb-6 mb-2">
        <h1 className="text-2xl sm:text-3xl font-semibold mb-2">#{tag}</h1>
        <p className="text-sm text-muted">{posts.length} post{posts.length !== 1 ? 's' : ''}.</p>
      </header>
      {posts.length === 0 ? (
        <p className="text-muted py-8">No posts with this tag.</p>
      ) : (
        <div>
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
