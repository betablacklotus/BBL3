import { getVideoPosts, formatDate } from '../postStore';
import { navigate } from '../router';
import { useMeta } from '../seo';
import { MediaProtect } from '../components/MediaProtect';

export function VideosPage() {
  useMeta({ title: 'Videos', description: 'All posts containing video.' });
  const posts = getVideoPosts();

  return (
    <div className="max-w-prose mx-auto px-4 sm:px-6 pt-8 sm:pt-10">
      <header className="border-b rule pb-6 mb-8">
        <h1 className="text-2xl sm:text-3xl font-semibold">Videos</h1>
      </header>

      {posts.length === 0 ? (
        <p className="text-muted text-sm">
          Video posts will appear here automatically when their content includes a video embed.
        </p>
      ) : (
        <ul className="list-none p-0 m-0">
          {posts.map((post) => (
            <li key={post.slug} className="border-b rule last:border-b-0">
              <article className="py-6 sm:py-8">
                <div className="flex items-center gap-2 mb-2 text-xs text-muted">
                  <time dateTime={post.date}>{formatDate(post.date)}</time>
                </div>

                <h2 className="text-xl sm:text-2xl font-semibold mb-3">
                  <a
                    href={`/${post.slug}`}
                    style={{ color: '#1a1a1a', textDecoration: 'none' }}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(`/${post.slug}`);
                    }}
                  >
                    {post.title}
                  </a>
                </h2>

                {post.featuredImage && (
                  <MediaProtect className="mb-4 cursor-pointer">
                    <img
                      src={post.featuredImage}
                      alt={post.title}
                      loading="lazy"
                      onClick={() => navigate(`/${post.slug}`)}
                      className="w-full h-auto border rule cursor-pointer"
                      style={{ maxHeight: 280, objectFit: 'cover' }}
                    />
                  </MediaProtect>
                )}

                {post.excerpt && (
                  <p className="text-sm sm:text-base text-muted mb-4" style={{ lineHeight: 1.7 }}>
                    {post.excerpt}
                  </p>
                )}

                <a
                  href={`/${post.slug}`}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(`/${post.slug}`);
                  }}
                  className="text-sm"
                  style={{ textDecoration: 'none', borderBottom: '1px solid #1a1a1a', color: '#1a1a1a' }}
                >
                  Watch →
                </a>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
