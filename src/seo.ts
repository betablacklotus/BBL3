import { useEffect } from 'react';
import type { Post } from './types';
import { getExcerpt } from './postStore';

const SITE_NAME = 'Beta Black Lotus';
const SITE_URL = 'https://www.betablacklotus.com';

interface MetaOptions {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
}

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(href: string) {
  let el = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export function useMeta(opts: MetaOptions): void {
  useEffect(() => {
    const title = opts.title ? `${opts.title} — ${SITE_NAME}` : `${SITE_NAME} — A Personal Weblog`;
    document.title = title;

    const desc = opts.description || 'A personal weblog. Notes, essays, and field recordings.';
    const image = opts.image || '';
    const url = opts.url || `${SITE_URL}${window.location.pathname}`;
    const type = opts.type || 'website';

    setMeta('name', 'description', desc);
    setMeta('property', 'og:title', opts.title || SITE_NAME);
    setMeta('property', 'og:description', desc);
    setMeta('property', 'og:type', type);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:site_name', SITE_NAME);
    if (image) setMeta('property', 'og:image', image);
    setMeta('name', 'twitter:card', image ? 'summary_large_image' : 'summary');
    setMeta('name', 'twitter:title', opts.title || SITE_NAME);
    setMeta('name', 'twitter:description', desc);
    if (image) setMeta('name', 'twitter:image', image);
    setCanonical(url);
  }, [opts.title, opts.description, opts.image, opts.url, opts.type, opts.publishedTime]);
}

export function postMeta(post: Post): MetaOptions {
  return {
    title: post.socialTitle || post.title,
    description: post.socialDescription || getExcerpt(post),
    image: post.socialImage || post.featuredImage,
    type: 'article',
    publishedTime: post.date,
    url: `${SITE_URL}/${post.slug}`,
  };
}
