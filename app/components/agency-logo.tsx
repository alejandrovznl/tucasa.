'use client';
import { AGENCIES } from '@/lib/tucasa';
import { AGENCY_LOGO_FALLBACKS } from '@/lib/agency-logo-fallbacks';

export function recoverAgencyLogo(image: HTMLImageElement, id: string) {
  const fallback = AGENCY_LOGO_FALLBACKS[id];
  if (fallback && image.src !== fallback) image.src = fallback;
}
export default function AgencyLogo({ agency, size = 20 }: { agency: typeof AGENCIES[number]; size?: number }) {
  return <span className={`agency-logo agency-logo-${agency.id}`}><img src={agency.logo} alt="" width={size} height={size} decoding="async" style={{ width: size, height: size, maxWidth: size, maxHeight: size, objectFit: 'contain', flexShrink: 0 }} onError={event => recoverAgencyLogo(event.currentTarget, agency.id)} /></span>;
}
