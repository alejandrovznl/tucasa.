import { photoURL, type Property } from '@/lib/tucasa';

export default function PropertyImage({ property, loading = 'lazy', view = 0 }: { property: Property; loading?: 'lazy' | 'eager'; view?: number }) {
  const fallback = Number(property.id.match(/\d+$/)?.[0] || 1) - 1;
  const index = property.photoIndex ?? Math.abs(fallback) % 6;
  const column = index % 3, row = Math.floor(index / 3);
  return <span className="property-image"><img src={photoURL(`${property.photo}-${view === 0 ? 'collection' : `view${view + 1}`}`)} alt={`${property.title}, foto ${view + 1}`} loading={loading} style={{ width: '300%', left: `${-column * 100}%`, transform: `translateY(-${row === 0 ? 25 : 75}%) scale(1.012)`, transformOrigin: `${(column + .5) / 3 * 100}% ${row === 0 ? 25 : 75}%` }} /></span>;
}
