import { useEffect, useState } from 'react';

// History-API router. Routes:
//   /             — home
//   /videos       — posts with video
//   /music        — posts with Bandcamp embeds
//   /post/:slug   — individual post
//   /EPK          — about page
//   /archive      — archive
//   /contact      — contact page
//   /tag/:tag     — posts by tag
//   /backstage-3k9mxf2p7qw4 — admin panel

export interface Route {
  path: string;
  params: Record<string, string>;
}

function parsePath(): Route {
  const parts = window.location.pathname.split('/').filter(Boolean);

  if (parts.length === 0) return { path: '/', params: {} };
  if (parts.length === 1 && parts[0] === 'videos') return { path: '/videos', params: {} };
  if (parts.length === 1 && parts[0] === 'music') return { path: '/music', params: {} };
  if (parts.length === 1 && parts[0] === 'EPK') return { path: '/EPK', params: {} };
  if (parts.length === 1 && parts[0] === 'archive') return { path: '/archive', params: {} };
  if (parts.length === 1 && parts[0] === 'contact') return { path: '/contact', params: {} };
  if (parts.length === 1 && parts[0] === 'backstage-3k9mxf2p7qw4')
    return { path: '/backstage-3k9mxf2p7qw4', params: {} };
  if (parts.length === 2 && parts[0] === 'tag')
    return { path: '/tag', params: { tag: parts[1] } };
  if (parts.length === 2 && parts[0] === 'page')
    return { path: '/page', params: { slug: parts[1] } };
  if (parts.length === 1 && parts[0] === 'gallery-preview')
    return { path: '/gallery-preview', params: {} };
  if (parts.length === 1)
    return { path: '/post', params: { slug: parts[0] } };

  return { path: '/', params: {} };
}

export function useRouter(): Route {
  const [route, setRoute] = useState<Route>(parsePath());

  useEffect(() => {
    const onChange = () => {
      setRoute(parsePath());
      window.scrollTo(0, 0);
    };
    window.addEventListener('popstate', onChange);
    return () => window.removeEventListener('popstate', onChange);
  }, []);

  return route;
}

export function navigate(path: string): void {
  history.pushState(null, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}
