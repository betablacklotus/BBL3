const SUPABASE_URL = 'https://ohjnanqwjgqjmnwlknsh.supabase.co/functions/v1/rss-feed';

export async function onRequest(context) {
  try {
    const upstream = await fetch(`${SUPABASE_URL}?t=${Date.now()}`, {
      headers: { 'Accept': 'application/rss+xml' },
    });

    if (!upstream.ok) {
      return new Response('Feed temporarily unavailable', {
        status: 502,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    const xml = await upstream.text();
    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
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
