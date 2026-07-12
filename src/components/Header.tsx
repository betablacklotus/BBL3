import { useEffect, useRef, useState } from 'react';
import { Search, Menu, X } from 'lucide-react';
import { navigate, useRouter } from '../router';
import { searchPosts } from '../postStore';
import { getAllPages } from '../pageStore';
import type { Post } from '../types';

const NAV_LINKS = [
  { label: 'Home', path: '/' },
  { label: 'Music', path: '/music' },
  { label: 'Videos', path: '/videos' },
  { label: 'EPK', path: '/EPK' },
  { label: 'Contact', path: '/contact' },
];

export function Header() {
  const route = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Post[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
    setQuery('');
    setResults([]);
  }, [route]);

  // Close search on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // Lock scroll when mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const isActive = (path: string): boolean => {
    if (path === '/') return route.path === '/';
    return route.path === path;
  };

  const pageNavLinks = getAllPages().filter((p) => p.showInHeader);

  const handleSearch = (q: string) => {
    setQuery(q);
    setResults(searchPosts(q).slice(0, 8));
  };

  const goToPost = (slug: string) => {
    setSearchOpen(false);
    setQuery('');
    setResults([]);
    navigate(`/${slug}`);
  };

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 bg-paper border-b rule"
        style={{ height: 64 }}
      >
        <div className="max-w-page mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-3">
          {/* Logo */}
          <a
            href="/"
            className="nav-link flex-shrink-0 font-bold text-base sm:text-lg"
            style={{ letterSpacing: '-0.02em' }}
            onClick={(e) => { e.preventDefault(); navigate('/'); setMenuOpen(false); }}
          >
            Beta Black Lotus
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-5 flex-1 justify-center">
            {NAV_LINKS.map((link) => (
              <a
                key={link.path}
                href={link.path}
                className={`nav-link text-sm ${isActive(link.path) ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); navigate(link.path); }}
              >
                {link.label}
              </a>
            ))}
            {pageNavLinks.map((page) => (
              <a
                key={page.slug}
                href={`/page/${page.slug}`}
                className={`nav-link text-sm ${route.path === '/page' && window.location.pathname === `/page/${page.slug}` ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); navigate(`/page/${page.slug}`); }}
              >
                {page.title}
              </a>
            ))}
            <a href="/feed.xml" className="nav-link text-sm">RSS</a>
          </nav>

          {/* Right side: search + mobile menu */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <div ref={searchRef} className="relative">
              <button
                className="header-btn flex items-center gap-1.5 text-sm"
                onClick={() => setSearchOpen(!searchOpen)}
                aria-label="Search"
                aria-expanded={searchOpen}
              >
                <Search size={16} />
                <span className="hidden sm:inline">Search</span>
              </button>

              {searchOpen && (
                <div
                  className="absolute right-0 top-full mt-2 bg-white border rule shadow-lg"
                  style={{ width: 'min(320px, calc(100vw - 32px))' }}
                >
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={query}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search post titles…"
                    className="field"
                    style={{ borderRadius: 0, border: 'none', borderBottom: '1px solid #c9c4b8' }}
                  />
                  <div className="max-h-72 overflow-y-auto overscroll-contain">
                    {query && results.length === 0 && (
                      <p className="px-3 py-3 text-sm text-muted">No posts found.</p>
                    )}
                    {!query && (
                      <p className="px-3 py-3 text-xs text-muted">Start typing to search…</p>
                    )}
                    {results.map((post) => (
                      <button
                        key={post.slug}
                        onClick={() => goToPost(post.slug)}
                        className="w-full text-left px-3 py-3 text-sm hover:bg-panel border-b rule last:border-b-0"
                        style={{ minHeight: 48 }}
                      >
                        <div className="font-medium truncate">{post.title}</div>
                        <div className="text-xs text-muted truncate mt-0.5">{post.date}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile menu toggle */}
            <button
              className="header-btn md:hidden"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile nav overlay — rendered outside header so it covers full screen */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ top: 64 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(26,26,26,0.4)' }}
            onClick={() => setMenuOpen(false)}
          />
          {/* Drawer */}
          <nav
            className="relative bg-paper border-b rule"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="max-w-page mx-auto px-4">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.path}
                  href={link.path}
                  className={`mobile-nav-link ${isActive(link.path) ? 'font-semibold' : ''}`}
                  onClick={(e) => { e.preventDefault(); navigate(link.path); setMenuOpen(false); }}
                >
                  {link.label}
                </a>
              ))}
              {pageNavLinks.map((page) => (
                <a
                  key={page.slug}
                  href={`/page/${page.slug}`}
                  className="mobile-nav-link"
                  onClick={(e) => { e.preventDefault(); navigate(`/page/${page.slug}`); setMenuOpen(false); }}
                >
                  {page.title}
                </a>
              ))}
              <a
                href="/feed.xml"
                className="mobile-nav-link"
                onClick={() => setMenuOpen(false)}
              >
                RSS
              </a>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
