import { getAllPosts, formatDateShort } from '../postStore';
import { useMeta } from '../seo';
import { navigate } from '../router';

export function ArchivePage() {
  useMeta({ title: 'Archive', description: 'Complete archive of all posts by date.' });
  const posts = getAllPosts();

  // Group by year
  const byYear = new Map<string, typeof posts>();
  for (const post of posts) {
    const year = new Date(post.date).getFullYear().toString();
    if (!byYear.has(year)) byYear.set(year, []);
    byYear.get(year)!.push(post);
  }
  const years = Array.from(byYear.keys()).sort((a, b) => Number(b) - Number(a));

  return (
    <div className="max-w-prose mx-auto px-4 sm:px-6 pt-8 sm:pt-10 pb-20">
      <header className="border-b rule pb-6 mb-8">
        <h1 className="text-2xl sm:text-3xl font-semibold mb-2">Archive</h1>
        <p className="text-sm text-muted">{posts.length} posts, by year.</p>
      </header>

      {years.map((year) => (
        <section key={year} className="mb-10">
          <h2 className="text-lg font-semibold mb-3 border-b rule pb-2">{year}</h2>
          <ul className="list-none p-0 m-0">
            {byYear.get(year)!.map((post) => (
              <li
                key={post.slug}
                className="flex items-baseline gap-4 py-2 border-b rule"
                style={{ flexWrap: 'wrap' }}
              >
                <time
                  dateTime={post.date}
                  className="text-xs text-muted flex-shrink-0"
                  style={{ width: 90 }}
                >
                  {formatDateShort(post.date)}
                </time>
                <a
                  href={`/${post.slug}`}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(`/${post.slug}`);
                  }}
                  style={{ textDecoration: 'none', color: '#1a1a1a' }}
                  className="text-sm hover:underline flex-1 min-w-0"
                >
                  {post.title}
                  {post.pinned && (
                    <span className="ml-2 text-[10px] uppercase tracking-wider text-muted border rule px-1">
                      Pinned
                    </span>
                  )}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
