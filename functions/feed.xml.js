const SUPABASE_URL = 'https://ohjnanqwjgqjmnwlknsh.supabase.co/functions/v1/rss-feed';

function wantsHtml(request) {
  const accept = request.headers.get('Accept') || '';
  if (accept.includes('text/html')) return true;
  if (accept.includes('application/rss+xml') || accept.includes('application/xml')) return false;
  return true;
}

export async function onRequest(context) {
  const { request } = context;
  try {
    const format = wantsHtml(request) ? 'html' : 'xml';
    const upstream = await fetch(`${SUPABASE_URL}?format=${format}&t=${Date.now()}`, {
      headers: { 'Accept': format === 'html' ? 'text/html' : 'application/rss+xml' },
    });

    if (!upstream.ok) {
      return new Response('Feed temporarily unavailable', {
        status: 502,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    const body = await upstream.text();
    const contentType = format === 'html'
      ? 'text/html; charset=utf-8'
      : 'application/rss+xml; charset=utf-8';

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch {
    return new Response('Feed temporarily unavailable', {
      status: 502,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}
