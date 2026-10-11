import { type PublicationContact } from './tucasa';

const PUBLISHER_NAMES = ['Mariana Flores', 'Carlos Méndez', 'Lucía Roca', 'Pablo Salinas', 'Gabriela Ortiz', 'Fernando Ruiz'];

export function samplePublicationContact(source: string, sequence: number): PublicationContact | undefined {
  const index = sequence % PUBLISHER_NAMES.length;
  const phone = `+591 0000 01${String(index + 1).padStart(2, '0')}`;
  if (source === 'marketplace') return { name: PUBLISHER_NAMES[index], messengerDemo: true, ...(index % 2 === 0 ? { phone } : {}) };
  if (source === 'deber') return { phone, ...(index % 2 === 0 ? { name: PUBLISHER_NAMES[index] } : {}) };
  if (source === 'links' && index % 3 !== 2) return { phone, ...(index % 3 === 0 ? { name: PUBLISHER_NAMES[index] } : {}) };
  return undefined;
}

// Never derive a real Messenger destination from a fictional publisher name.
export function validatedMessengerUrl(contact: PublicationContact): string | null {
  const url = contact.messengerUrl;
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.port) return null;
    if (parsed.hostname === 'm.me' && /^\/[a-zA-Z0-9._-]+\/?$/.test(parsed.pathname)) return parsed.href;
    if (['messenger.com', 'www.messenger.com'].includes(parsed.hostname) && /^\/t\/[a-zA-Z0-9._-]+\/?$/.test(parsed.pathname)) return parsed.href;
  } catch { /* Missing or invalid source link. */ }
  return null;
}
