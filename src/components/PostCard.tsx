import { useRef, useEffect } from 'react';
import { MediaProtect } from './MediaProtect';
import { FeedVideoPlayer } from './FeedVideoPlayer';
import { formatDate, getExcerpt, getBandcampEmbed, getBunnyVideo } from '../postStore';
import { navigate } from '../router';
import type { Post } from '../types';

const VIDEO_EXT = /\.(mp4|webm|ogg|mov|m4v)(\?|$)/i;
function isVideoUrl(url: string): boolean {
  return VIDEO_EXT.test(url);
}

interface PostCardProps {
  post: Post;
  showPinBadge?: boolean;
}

export function PostCard({ post, showPinBadge = true }: PostCardProps) {
  const excerpt = getExcerpt(post);
  const bandcampEmbed = getBandcampEmbed(post);
  const bunnyVideo = getBunnyVideo(post);

  const go = () => navigate(`/${post.slug}`);

  const bandcampRef = useRef<HTMLDivElement>(null);
  const bandcampIframeRef = useRef<HTMLIFrameElement>(null);
  const wasPlayingRef = useRef(false);

  useEffect(() => {
    if (!bandcampEmbed) return;
    const container = bandcampRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            if (wasPlayingRef.current && bandcampIframeRef.current && !bandcampIframeRef.current.src) {
              bandcampIframeRef.current.src = bandcampIframeRef.current.dataset.src || '';
            }
          } else {
            const iframe = bandcampIframeRef.current;
            if (iframe && iframe.src) {
              wasPlayingRef.current = true;
              iframe.dataset.src = iframe.src;
              iframe.src = '';
            }
          }
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [bandcampEmbed]);

  return (
    <article className="post-card py-6 sm:py-8">
      <div className="flex items-center gap-2 mb-2 text-xs text-muted">
        <time dateTime={post.date}>{formatDate(post.date)}</time>
        {post.pinned && showPinBadge && (
          <span className="border rule px-1.5 py-0.5 text-[10px] uppercase tracking-wider">
            Pinned
          </span>
        )}
      </div>

      <h2 className="text-xl sm:text-2xl font-semibold mb-2">
        <a
          href={`/${post.slug}`}
          className="no-underline"
          style={{ color: '#1a1a1a', textDecoration: 'none' }}
          onClick={(e) => {
            e.preventDefault();
            go();
          }}
        >
          {post.title}
        </a>
      </h2>

      {bunnyVideo ? (
        <div className="bunny-embed media-protect mb-4">
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
        <div className="bandcamp-embed mb-4" ref={bandcampRef}>
          <iframe
            ref={bandcampIframeRef}
            src={`https://bandcamp.com/EmbeddedPlayer/${bandcampEmbed.kind}=${bandcampEmbed.id}/size=large/bgcol=ffffff/linkcol=0687f5/tracklist=false/transparent=true/`}
            title="Bandcamp player"
            seamless
            loading="lazy"
          />
        </div>
      ) : post.featuredImage ? (
        <MediaProtect className="mb-4">
          {isVideoUrl(post.featuredImage) ? (
            <FeedVideoPlayer src={post.featuredImage} title={post.title} />
          ) : (
            <a
              href={`/${post.slug}`}
              onClick={(e) => { e.preventDefault(); go(); }}
              style={{ display: 'block', cursor: 'pointer' }}
            >
              <img
                src={post.featuredImage}
                alt={post.title}
                loading="lazy"
                className="w-full h-auto border rule"
                style={{ maxHeight: 360, objectFit: 'cover', display: 'block' }}
              />
            </a>
          )}
        </MediaProtect>
      ) : null}

      <p className="text-sm sm:text-base text-muted mb-3" style={{ lineHeight: 1.7 }}>
        {excerpt}
      </p>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <a
          href={`/${post.slug}`}
          onClick={(e) => {
            e.preventDefault();
            go();
          }}
          className="text-sm"
          style={{ textDecoration: 'none', borderBottom: '1px solid #1a1a1a', color: '#1a1a1a' }}
        >
          Read more →
        </a>
        {post.tags && post.tags.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {post.tags.map((tag) => (
              <a
                key={tag}
                href={`/tag/${tag}`}
                className="text-xs text-muted"
                style={{ textDecoration: 'none' }}
                onClick={(e) => { e.preventDefault(); navigate(`/tag/${tag}`); }}
              >
                #{tag}
              </a>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
