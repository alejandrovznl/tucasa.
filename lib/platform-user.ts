export type PlatformUser = {
  userId: string;
  displayName: string;
  email: string;
  fullName: string | null;
};

type HeaderReader = { get(name: string): string | null };

// Only consume identity headers supplied by the Sites dispatcher. Never read
// user identity from request bodies, query parameters or browser storage.
export async function readPlatformUser(headers: HeaderReader): Promise<PlatformUser | null> {
  const providedId = headers.get('oai-authenticated-user-id')?.trim() || '';
  const rawEmail = headers.get('oai-authenticated-user-email')?.trim() || '';
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail) ? rawEmail : '';
  if (!providedId && !email) return null;

  let userId = providedId;
  // Some existing workspace/capture requests forward authenticated email but
  // omit the newer site-scoped ID. Keep that compatibility key stable and avoid
  // storing an email in primary keys. Prefer the site-scoped ID when supplied.
  if (!userId) {
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(email.toLowerCase()));
    userId = `legacy-email:${Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('')}`;
  }

  let fullName: string | null = null;
  const encodedName = headers.get('oai-authenticated-user-full-name');
  if (encodedName && headers.get('oai-authenticated-user-full-name-encoding') === 'percent-encoded-utf-8') {
    try { fullName = decodeURIComponent(encodedName).trim() || null; } catch { /* Optional name can be absent. */ }
  }
  return { userId, email, fullName, displayName: fullName || email || 'Asesor' };
}
