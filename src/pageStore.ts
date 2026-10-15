import type { Page } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

let _pages: Page[] | null = null;
let _loading: Promise<void> | null = null;

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

function dbRowToPage(row: Record<string, unknown>): Page {
  return {
    slug: row.slug as string,
    title: row.title as string,
    content: row.content as string,
    excerpt: row.excerpt as string | undefined,
    featuredImage: row.featured_image as string | undefined,
    socialTitle: row.social_title as string | undefined,
    socialDescription: row.social_description as string | undefined,
    socialImage: row.social_image as string | undefined,
    showInHeader: row.show_in_header as boolean,
    showInFooter: row.show_in_footer as boolean,
  };
}

function pageToDbRow(page: Page): Record<string, unknown> {
  return {
    slug: page.slug,
    title: page.title,
    content: page.content ?? '',
    excerpt: page.excerpt ?? null,
    featured_image: page.featuredImage ?? null,
    social_title: page.socialTitle ?? null,
    social_description: page.socialDescription ?? null,
    social_image: page.socialImage ?? null,
    show_in_header: page.showInHeader ?? false,
    show_in_footer: page.showInFooter ?? false,
  };
}

export async function loadPages(): Promise<void> {
  if (_loading) return _loading;
  _loading = (async () => {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/pages?order=title.asc&select=*`,
        { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` } }
      );
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      const rows = await res.json() as Record<string, unknown>[];
      _pages = rows.map(dbRowToPage);
      await seedBuiltinPages();
    } catch {
      _pages = [];
    }
  })();
  return _loading;
}

export function getAllPages(): Page[] {
  return _pages ? [..._pages].sort((a, b) => a.title.localeCompare(b.title)) : [];
}

export function getPage(slug: string): Page | undefined {
  return getAllPages().find((p) => p.slug === slug);
}

async function adminAction(action: string, payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-data`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
    body: JSON.stringify({ action, ...payload }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export async function createPage(page: Page): Promise<boolean> {
  if (getAllPages().some((p) => p.slug === page.slug)) return false;
  await adminAction('upsertPage', { page: pageToDbRow(page) });
  await loadPages();
  return true;
}

export async function updatePage(slug: string, updates: Partial<Page>): Promise<boolean> {
  if (!_pages) return false;
  const idx = _pages.findIndex((p) => p.slug === slug);
  if (idx === -1) return false;
  const merged = { ..._pages[idx], ...updates };
  await adminAction('upsertPage', { page: pageToDbRow(merged) });
  await loadPages();
  return true;
}

export async function deletePage(slug: string): Promise<boolean> {
  await adminAction('deletePage', { slug });
  await loadPages();
  return true;
}

export async function seedBuiltinPages(): Promise<void> {
  const existing = getAllPages().map((p) => p.slug);
  for (const page of BUILTIN_PAGES) {
    if (!existing.includes(page.slug)) {
      await adminAction('upsertPage', { page: pageToDbRow(page) });
    }
  }
  if (_pages) {
    const existingSlugs = _pages.map((p) => p.slug);
    for (const page of BUILTIN_PAGES) {
      if (!existingSlugs.includes(page.slug)) {
        _pages.push(page);
      }
    }
  }
}
