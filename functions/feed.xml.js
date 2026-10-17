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
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; media-src 'self' https:; frame-src https://bandcamp.com https://video.bunny.net https://audio.bunny.net; connect-src 'self' https://*.supabase.co; font-src 'self'; object-src 'none'; base-uri 'self'",
      },
    });
  } catch {
    return new Response('Feed temporarily unavailable', {
      status: 502,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}
