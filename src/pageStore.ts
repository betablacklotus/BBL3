import type { Page } from './types';

const STORAGE_KEY = 'terminal_blog_pages_v1';

function loadPages(): Page[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Page[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // fall through
  }
  return [];
}

function savePages(pages: Page[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pages));
  } catch {
    // storage full; non-fatal
  }
}

let _pages: Page[] | null = null;

export function getAllPages(): Page[] {
  if (!_pages) _pages = loadPages();
  return [..._pages].sort((a, b) => a.title.localeCompare(b.title));
}

export function getPage(slug: string): Page | undefined {
  return getAllPages().find((p) => p.slug === slug);
}

export function createPage(page: Page): boolean {
  const pages = getAllPages();
  if (pages.some((p) => p.slug === page.slug)) return false;
  pages.push(page);
  _pages = pages;
  savePages(pages);
  return true;
}

export function updatePage(slug: string, updates: Partial<Page>): boolean {
  if (!_pages) _pages = loadPages();
  const idx = _pages.findIndex((p) => p.slug === slug);
  if (idx === -1) return false;
  _pages[idx] = { ..._pages[idx], ...updates };
  savePages(_pages);
  return true;
}

export function deletePage(slug: string): boolean {
  const pages = getAllPages().filter((p) => p.slug !== slug);
  _pages = pages;
  savePages(pages);
  return true;
}

const BUILTIN_PAGES: Page[] = [
  {
    slug: 'epk',
    title: 'EPK',
    showInHeader: false,
    showInFooter: false,
    excerpt: 'About Beta Black Lotus.',
    content: `**Beta Black Lotus** is a personal weblog kept by its author. It is a notebook in public — a place to write down things I want to remember and share.

## What I write about

- Small software projects and the lessons learned from them
- Books, mostly old ones
- Field recordings and the places I made them
- The occasional opinion about tools, held loosely

## How this site is built

This site is built to be lightweight and portable. It uses plain HTML, CSS, and a small amount of JavaScript. There is no tracking, no analytics, no cookie banner, and no newsletter popup. The font is IBM Plex Mono. The design is deliberately spare.

The source is a set of static files that can be hosted on almost any web server, including inexpensive shared hosting. See the [contact page](/contact) if you want to reach me.

## Subscribe

If you use an RSS reader, you can subscribe to the [RSS feed](/feed.xml). That is the best way to keep up.`,
  },
  {
    slug: 'contact',
    title: 'Contact',
    showInHeader: false,
    showInFooter: false,
    excerpt: 'How to reach the author of Beta Black Lotus.',
    content: `The best way to reach me is by email. I read everything, though I cannot always reply.

Write to me at you@example.com.`,
  },
];

export function seedBuiltinPages(): void {
  const existing = getAllPages().map((p) => p.slug);
  for (const page of BUILTIN_PAGES) {
    if (!existing.includes(page.slug)) {
      createPage(page);
    }
  }
}
