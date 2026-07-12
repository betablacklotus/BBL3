import { useEffect, useMemo, useRef } from 'react';
import { MediaProtect } from '../components/MediaProtect';
import { Lightbox, useLightbox } from '../components/Lightbox';
import { EditFab } from '../components/EditFab';
import { renderMarkdown } from '../markdown';
import { getPost, formatDate, getExcerpt, getBandcampEmbed, getBunnyVideo } from '../postStore';

import { postMeta, useMeta } from '../seo';
import { navigate } from '../router';

interface PostPageProps {
  slug: string;
}

export function PostPage({ slug }: PostPageProps) {
  const post = getPost(slug);
  const contentRef = useRef<HTMLDivElement>(null);

  const meta = post ? postMeta(post) : {};
  useMeta(meta);

  const bunnyVideo = post ? getBunnyVideo(post) : undefined;
  const bandcampEmbed = post ? getBandcampEmbed(post) : undefined;

  const html = useMemo(() => {
    if (!post) return '';
    let content = post.content.replace(/^\s*#\s[^\n]*\n?/, '');
    // Strip the embed promoted to the cover slot so it doesn't appear twice
    if (bunnyVideo) {
      content = content.replace(/^:::bunny-video\s+\S+\s+\S+\s*\n?/m, '');
    } else if (bandcampEmbed?.kind === 'track') {
      content = content.replace(/^:::bandcamp-track\s+\S+\s*\n?/m, '');
    } else if (bandcampEmbed?.kind === 'album') {
      content = content.replace(/^:::bandcamp-album\s+\S+\s*\n?/m, '');
    }
    return renderMarkdown(content);
  }, [post]);

  const { lightboxImages, lightboxIndex, closeLightbox, navigateLightbox } = useLightbox(contentRef);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const onContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG' || target.tagName === 'VIDEO' || target.tagName === 'AUDIO' || target.closest('iframe')) {
        e.preventDefault();
      }
    };

    const onDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG') {
        e.preventDefault();
      }
    };

    el.addEventListener('contextmenu', onContextMenu);
    el.addEventListener('dragstart', onDragStart);
    return () => {
      el.removeEventListener('contextmenu', onContextMenu);
      el.removeEventListener('dragstart', onDragStart);
    };
  }, [html]);

  if (!post) {
    return (
      <div className="max-w-prose mx-auto px-4 sm:px-6 pt-10 pb-20">
        <h1 className="text-2xl font-semibold mb-4">Post not found</h1>
        <p className="text-muted mb-4">The post you are looking for does not exist or has been removed.</p>
        <a href="/" className="btn" onClick={(e) => { e.preventDefault(); navigate('/'); }}>← Back home</a>
      </div>
    );
  }

  return (
    <article className="max-w-prose mx-auto px-4 sm:px-6 pt-8 sm:pt-10 pb-20">
      {/* Breadcrumb */}
      <div className="text-xs text-muted mb-6">
        <a href="/" style={{ textDecoration: 'none' }} onClick={(e) => { e.preventDefault(); navigate('/'); }}>Home</a>
        <span className="mx-1">/</span>
        <span>{post.title}</span>
      </div>

      {/* Header */}
      <header className="mb-5">
        <div className="flex items-center gap-2 mb-3 text-xs text-muted">
          <time dateTime={post.date}>{formatDate(post.date)}</time>
          {post.pinned && (
            <span className="border rule px-1.5 py-0.5 text-[10px] uppercase tracking-wider">
              Pinned
            </span>
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold" style={{ lineHeight: 1.2 }}>
          {post.title}
        </h1>
      </header>

      {/* Cover: Bunny video > Bandcamp player > featured image */}
      {bunnyVideo ? (
        <div className="bunny-embed media-protect mb-8">
          <div className="bunny-video-wrap">
            <iframe
              src={`https://video.bunny.net/embed/${bunnyVideo.libraryId}/${bunnyVideo.videoId}`}
              title={post.title}
              allow="autoplay;fullscreen;picture-in-picture"
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        </div>
      ) : bandcampEmbed ? (
        <div className="bandcamp-embed mb-8">
          <iframe
            src={`https://bandcamp.com/EmbeddedPlayer/${bandcampEmbed.kind}=${bandcampEmbed.id}/size=large/bgcol=ffffff/linkcol=0687f5/tracklist=false/transparent=true/`}
            title="Bandcamp player"
            seamless
            loading="lazy"
          />
        </div>
      ) : post.featuredImage ? (
        <MediaProtect className="mb-8">
          <img
            src={post.featuredImage}
            alt={post.title}
            className="w-full h-auto border rule"
          />
        </MediaProtect>
      ) : null}

      {/* Content */}
      <div
        ref={contentRef}
        className="prose-mono"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {/* Footer nav */}
      <footer className="mt-12 pt-6 border-t rule">
        {post.tags && post.tags.length > 0 && (
          <div className="flex gap-3 flex-wrap mb-8">
            {post.tags.map((tag) => (
              <a key={tag} href={`/tag/${tag}`} className="text-xs text-muted" style={{ textDecoration: 'none' }}
                onClick={(e) => { e.preventDefault(); navigate(`/tag/${tag}`); }}>
                #{tag}
              </a>
            ))}
          </div>
        )}
        <ShareButtons
          url={`https://betablacklotus.com/${post.slug}`}
          title={post.socialTitle || post.title}
          description={getExcerpt(post)}
        />
        <div className="mt-6">
          <a href="/" className="btn" onClick={(e) => { e.preventDefault(); navigate('/'); }}>← Back to home</a>
        </div>
      </footer>

      {lightboxIndex >= 0 && (
        <Lightbox
          images={lightboxImages}
          index={lightboxIndex}
          onClose={closeLightbox}
          onNavigate={navigateLightbox}
        />
      )}

      <EditFab slug={post.slug} />
    </article>
  );
}function ShareButtons({ url, title, description }: { url: string; title: string; description: string }) {
  const encoded = {
    url: encodeURIComponent(url),
    title: encodeURIComponent(title),
    desc: encodeURIComponent(description),
  };

  const xHref = `https://x.com/intent/tweet?text=${encoded.title}&url=${encoded.url}`;
  const fbHref = `https://www.facebook.com/sharer/sharer.php?u=${encoded.url}&quote=${encoded.title}`;

  return (
    <div>
      <div className="flex gap-2 flex-wrap">
        <a
          href={xHref}
          target="_blank"
          rel="noopener noreferrer"
          className="btn"
          style={{ padding: '8px 12px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          aria-label="Share on X"
        >
          <XIcon />
        </a>

        <button
          onClick={() => window.open(fbHref, '_blank', 'noopener,noreferrer')}
          className="btn"
          style={{ padding: '8px 12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          aria-label="Share on Facebook"
        >
          <FacebookIcon />
        </button>
      </div>
    </div>
  );
}

function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.257 5.622L18.244 2.25Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.97h-1.513c-1.491 0-1.956.931-1.956 1.887v2.269h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073Z" />
    </svg>
  );
}