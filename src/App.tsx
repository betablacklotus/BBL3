import { useEffect, useState } from 'react';
import { useRouter, navigate } from './router';
import { Header } from './components/Header';
import { HomePage } from './pages/HomePage';
import { PostPage } from './pages/PostPage';
import { VideosPage } from './pages/VideosPage';
import { MusicPage } from './pages/MusicPage';
import { ArchivePage } from './pages/ArchivePage';
import { TagPage } from './pages/TagPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { StandalonePage } from './pages/StandalonePage';
import { GalleryPreviewPage } from './pages/GalleryPreviewPage';
import { loadPosts } from './postStore';
import { loadPages, getAllPages } from './pageStore';
import { EditFab } from './components/EditFab';

function App() {
  const route = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      await Promise.all([loadPosts(), loadPages()]);
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    const onCopy = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      e.preventDefault();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c' && window.getSelection()?.toString()) {
        e.preventDefault();
      }
    };
    document.addEventListener('copy', onCopy);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const isAdmin = route.path === '/backstage-3k9mxf2p7qw4';

  let page;
  switch (route.path) {
    case '/':
      page = <HomePage />;
      break;
    case '/post':
      page = <PostPage slug={route.params.slug} />;
      break;
    case '/videos':
      page = <VideosPage />;
      break;
    case '/music':
      page = <MusicPage />;
      break;
    case '/EPK':
      page = <StandalonePage slug="epk" />;
      break;
    case '/archive':
      page = <ArchivePage />;
      break;
    case '/contact':
      page = <StandalonePage slug="contact" />;
      break;
    case '/tag':
      page = <TagPage tag={route.params.tag} />;
      break;
    case '/page':
      page = <StandalonePage slug={route.params.slug} />;
      break;
    case '/backstage-3k9mxf2p7qw4':
      page = <AdminLoginPage />;
      break;
    case '/gallery-preview':
      page = <GalleryPreviewPage />;
      break;
    default:
      page = <AdminLoginPage />;
  }

  return (
    <div className="min-h-screen bg-paper">
      <Header />
      <main style={{ paddingTop: 64 }}>
        {isAdmin ? page : ready ? page : <div className="max-w-prose mx-auto px-4 sm:px-6 pt-20 text-center text-sm text-muted">Loading…</div>}
      </main>
      <Footer />
      {!isAdmin && <EditFab />}
    </div>
  );
}

function Footer() {
  const pageLinks = getAllPages().filter((p) => p.showInFooter);
  const pageHref = (slug: string) => (slug === 'epk' ? '/EPK' : slug === 'contact' ? '/contact' : `/page/${slug}`);
  return (
    <footer className="border-t rule mt-20">
      <div className="max-w-page mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted">
        <div>
          <strong style={{ color: '#1a1a1a' }}>Beta Black Lotus</strong>
        </div>
        <div className="flex gap-4 flex-wrap justify-center">
          <a href="/" style={{ textDecoration: 'none' }} onClick={(e) => { e.preventDefault(); navigate('/'); }}>Home</a>
          <a href="/music" style={{ textDecoration: 'none' }} onClick={(e) => { e.preventDefault(); navigate('/music'); }}>Music</a>
          <a href="/videos" style={{ textDecoration: 'none' }} onClick={(e) => { e.preventDefault(); navigate('/videos'); }}>Videos</a>
          {pageLinks.map((page) => (
            <a
              key={page.slug}
              href={pageHref(page.slug)}
              style={{ textDecoration: 'none' }}
              onClick={(e) => { e.preventDefault(); navigate(pageHref(page.slug)); }}
            >
              {page.title}
            </a>
          ))}
        </div>
        <div>© {new Date().getFullYear()}</div>
      </div>
    </footer>
  );
}

export default App;
