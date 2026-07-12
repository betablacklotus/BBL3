import { useEffect, useState, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface LightboxProps {
  images: { src: string; alt: string }[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function Lightbox({ images, index, onClose, onNavigate }: LightboxProps) {
  const current = images[index];

  const goPrev = useCallback(() => {
    onNavigate((index - 1 + images.length) % images.length);
  }, [index, images.length, onNavigate]);

  const goNext = useCallback(() => {
    onNavigate((index + 1) % images.length);
  }, [index, images.length, onNavigate]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose, goPrev, goNext]);

  if (!current) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: 'rgba(26, 26, 26, 0.92)' }}
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-4 text-paper hover:text-white transition-colors"
        style={{ zIndex: 101 }}
      >
        <X size={32} />
      </button>

      {/* Prev */}
      {images.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); goPrev(); }}
          aria-label="Previous"
          className="absolute left-2 sm:left-4 text-paper hover:text-white transition-colors"
          style={{ zIndex: 101 }}
        >
          <ChevronLeft size={40} />
        </button>
      )}

      {/* Image */}
      <img
        src={current.src}
        alt={current.alt}
        onClick={(e) => e.stopPropagation()}
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
        className="max-w-[92vw] max-h-[85vh] object-contain border border-rule"
        style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}
      />

      {/* Next */}
      {images.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); goNext(); }}
          aria-label="Next"
          className="absolute right-2 sm:right-4 text-paper hover:text-white transition-colors"
          style={{ zIndex: 101 }}
        >
          <ChevronRight size={40} />
        </button>
      )}

      {/* Counter */}
      {images.length > 1 && (
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 text-paper text-sm font-mono"
          style={{ zIndex: 101 }}
          onClick={(e) => e.stopPropagation()}
        >
          {index + 1} / {images.length}
        </div>
      )}
    </div>
  );
}

// Hook: attaches click handlers to all <img> elements within a container,
// collecting their src/alt and opening the lightbox on click.
export function useLightbox(containerRef: React.RefObject<HTMLElement>) {
  const [lightboxImages, setLightboxImages] = useState<{ src: string; alt: string }[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(-1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const imgs = Array.from(el.querySelectorAll('img'));
    const handlers: Array<{ img: HTMLImageElement; handler: (e: Event) => void }> = [];

    imgs.forEach((img, i) => {
      img.style.cursor = 'zoom-in';
      const handler = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        const collected = imgs.map((im) => ({ src: im.src, alt: im.alt }));
        setLightboxImages(collected);
        setLightboxIndex(i);
      };
      img.addEventListener('click', handler);
      handlers.push({ img, handler });
    });

    return () => {
      handlers.forEach(({ img, handler }) => {
        img.removeEventListener('click', handler);
        img.style.cursor = '';
      });
    };
  }, [containerRef]);

  const closeLightbox = useCallback(() => setLightboxIndex(-1), []);
  const navigateLightbox = useCallback((i: number) => setLightboxIndex(i), []);

  return {
    lightboxImages,
    lightboxIndex,
    closeLightbox,
    navigateLightbox,
  };
}
