export async function GET(request: Request, { params }: { params: Promise<{ z: string; x: string; y: string }> }) {
  const { z, x, y } = await params;
  if (![z, x, y].every(value => /^\d{1,6}$/.test(value))) return new Response('Invalid tile', { status: 400 });
  const zoom = Number(z), horizontal = Number(x), vertical = Number(y);
  if (zoom < 4 || zoom > 18 || horizontal >= 2 ** zoom || vertical >= 2 ** zoom) return new Response('Invalid tile', { status: 400 });
  // Fixed public tile source, with no user identity or search text forwarded.
  // Cache normal interactive requests; never prefetch a region or zoom stack.
  const referer = `${new URL(request.url).origin}/`;
  try {
    const response = await fetch(`https://tile.openstreetmap.org/${zoom}/${horizontal}/${vertical}.png`, {
      headers: { 'User-Agent': 'TuCasa/1.0 (+https://tucasa-santa-cruz.saidmendozac9.chatgpt.site)', Referer: referer },
      signal: AbortSignal.timeout(15000),
      cf: { cacheEverything: true },
    } as RequestInit & { cf: { cacheEverything: boolean } });
    if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) return new Response('Map unavailable', { status: 502, headers: { 'Cache-Control': 'no-store' } });
    return new Response(response.body, { headers: { 'Content-Type': response.headers.get('content-type')!, 'Cache-Control': response.headers.get('cache-control') || 'public, max-age=604800', 'X-Content-Type-Options': 'nosniff' } });
  } catch {
    return new Response('Map unavailable', { status: 502, headers: { 'Cache-Control': 'no-store' } });
  }
}
