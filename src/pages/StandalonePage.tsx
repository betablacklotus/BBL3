import { useMemo, useRef, useEffect } from 'react';
import { renderMarkdown } from '../markdown';
import { getPage } from '../pageStore';
import { useMeta } from '../seo';
import { navigate } from '../router';
import { MediaProtect } from '../components/MediaProtect';
import { Lightbox, useLightbox } from '../components/Lightbox';
import { EditFab } from '../components/EditFab';

interface StandalonePageProps {
  slug: string;
}

export function StandalonePage({ slug }: StandalonePageProps) {
  const page = getPage(slug);
  const contentRef = useRef<HTMLDivElement>(null);

  useMeta({
    title: page?.title ?? 'Page not found',
    description: page?.excerpt ?? '',
    ogTitle: page?.socialTitle,
    ogDescription: page?.socialDescription,
    ogImage: page?.socialImage ?? page?.featuredImage,
  });

  const html = useMemo(() => (page ? renderMarkdown(page.content) : ''), [page]);

  const { lightboxImages, lightboxIndex, closeLightbox, navigateLightbox } = useLightbox(contentRef);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const onContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG' || target.tagName === 'VIDEO' || target.tagName === 'AUDIO') {
        e.preventDefault();
      }
    };
    const onDragStart = (e: DragEvent) => {
      if ((e.target as HTMLElement).tagName === 'IMG') e.preventDefault();
    };
    el.addEventListener('contextmenu', onContextMenu);
    el.addEventListener('dragstart', onDragStart);
    return () => {
      el.removeEventListener('contextmenu', onContextMenu);
      el.removeEventListener('dragstart', onDragStart);
    };
  }, [html]);

  if (!page) {
    return (
      <div className="max-w-prose mx-auto px-4 sm:px-6 pt-10 pb-20">
        <h1 className="text-2xl font-semibold mb-4">Page not found</h1>
        <p className="text-muted mb-4">This page does not exist or has been removed.</p>
        <a href="/" className="btn" onClick={(e) => { e.preventDefault(); navigate('/'); }}>← Back home</a>
      </div>
    );
  }

  return (
    <article className="max-w-prose mx-auto px-4 sm:px-6 pt-8 sm:pt-10 pb-20">
      <div className="text-xs text-muted mb-6">
        <a href="/" style={{ textDecoration: 'none' }} onClick={(e) => { e.preventDefault(); navigate('/'); }}>Home</a>
        <span className="mx-1">/</span>
        <span>{page.title}</span>
      </div>

      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold" style={{ lineHeight: 1.2 }}>
          {page.title}
        </h1>
      </header>

      {page.featuredImage && (
        <MediaProtect className="mb-8">
          <img
            src={page.featuredImage}
            alt={page.title}
            className="w-full h-auto border rule"
          />
        </MediaProtect>
      )}

      <div
        ref={contentRef}
        className="prose-mono"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      <footer className="mt-12 pt-6 border-t rule">
        <a href="/" className="btn" onClick={(e) => { e.preventDefault(); navigate('/'); }}>← Back to home</a>
      </footer>

      {lightboxIndex >= 0 && (
        <Lightbox
          images={lightboxImages}
          index={lightboxIndex}
          onClose={closeLightbox}
          onNavigate={navigateLightbox}
        />
      )}

      <EditFab slug={page.slug} type="page" />
    </article>
  );
}
