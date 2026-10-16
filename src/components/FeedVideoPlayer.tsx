import { useEffect, useRef, useState } from 'react';

interface FeedVideoPlayerProps {
  src: string;
  title: string;
}

/**
 * Inline video player for the home feed.
 * - Shows poster frame on load (no autoplay).
 * - User clicks play to start.
 * - Pauses automatically when scrolled out of view.
 */
export function FeedVideoPlayer({ src, title }: FeedVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);

  // Pause when the player scrolls out of view
  useEffect(() => {
    const wrap = wrapRef.current;
    const video = videoRef.current;
    if (!wrap || !video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting && !video.paused) {
            video.pause();
          }
        }
      },
      { threshold: 0 }
    );
    observer.observe(wrap);
    return () => observer.disconnect();
  }, []);

  const handlePlayClick = () => {
    const video = videoRef.current;
    if (!video) return;
    video.play();
    setStarted(true);
  };

  return (
    <div
      ref={wrapRef}
      className="relative w-full border rule overflow-hidden"
      style={{ maxHeight: 360, aspectRatio: '16 / 9', background: '#000' }}
    >
      <video
        ref={videoRef}
        src={src}
        preload="metadata"
        playsInline
        controls={started}
        className="w-full h-full"
        style={{ objectFit: 'cover', display: 'block' }}
      />

      {!started && (
        <button
          type="button"
          onClick={handlePlayClick}
          aria-label={`Play video: ${title}`}
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.25)', cursor: 'pointer' }}
        >
          <span
            className="flex items-center justify-center rounded-full"
            style={{
              width: 64,
              height: 64,
              background: 'rgba(255,255,255,0.9)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="#1a1a1a" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </button>
      )}
    </div>
  );
}
