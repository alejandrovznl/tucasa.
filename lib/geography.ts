import snapshot from './geographic-anchors.json';
import type { Filters, PropertyType } from './tucasa';

export type GeographicAnchor = [number, number, string, number];
export type GeographicArea = { name: string; municipality: string; center: number[]; bounds?: number[]; anchors: GeographicAnchor[] };
export const GEOGRAPHIC_AREAS = snapshot.areas as GeographicArea[];
const normalized = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
export const ZONES = GEOGRAPHIC_AREAS.filter(a => a.name !== a.municipality).sort((a, b) => b.name.length - a.name.length);
export function resolveZone(text: string, freeText = false) {
  const value = ` ${normalized(text).replace(/villa (?:primero|1ro|1ero) de mayo/g, 'villa 1 de mayo')} `;
  const matches = (name: string) => {
    if (!value.includes(` ${name} `)) return false;
    if (!freeText || ['equipetrol', 'equipetrol norte', 'urubo', 'las palmas', 'plan 3000', 'zona norte', 'zona sur', 'zona este', 'zona oeste'].includes(name)) return true;
    if (name === 'centro' && /centro comercial/.test(value)) return false;
    return value.trim() === name || new RegExp(`\\b(?:en(?: el| la)?|zona|barrio|urbanizacion) ${name}\\b`).test(value);
  };
  return ZONES.find(a => matches(normalized(a.name))) || ZONES.find(a => matches(normalized(a.name).replace(/^(?:urbanizacion|barrio|urb) /, '')));
}
export function areasForSearch(f: Filters) {
  if (f.zone.trim()) {
    const zone = resolveZone(f.zone);
    return zone && (f.municipality === 'all' || zone.municipality === f.municipality) ? [zone] : [];
  }
  return GEOGRAPHIC_AREAS.filter(a => a.name === a.municipality && (f.municipality === 'all' || a.name === f.municipality));
}
export function anchorsForType(area: GeographicArea, type: PropertyType) {
  const kinds: Record<PropertyType, string[]> = {
    departamento: ['apartment'], duplex: ['apartment'], penthouse: ['apartment'], monoambiente: ['apartment', 'house'],
    casa: ['house'], quinta: ['house'], terreno: ['land'], lote: ['land'], finca: ['land'], agricola: ['land'], ganadera: ['land'],
    oficina: ['office'], local: ['shop'], galpon: ['warehouse'], bodega: ['warehouse'], proyecto: ['project', 'apartment'],
  };
  return area.anchors.filter(a => kinds[type].includes(a[2]));
}
export function zoneForAnchor(area: GeographicArea, anchor: GeographicAnchor) {
  if (area.name !== area.municipality) return area.name;
  const candidates = ZONES.filter(z => z.municipality === area.municipality && z.bounds && anchor[0] > z.bounds[0] && anchor[0] < z.bounds[2] && anchor[1] > z.bounds[1] && anchor[1] < z.bounds[3]);
  candidates.sort((a, b) => Math.hypot(a.center[0] - anchor[0], a.center[1] - anchor[1]) - Math.hypot(b.center[0] - anchor[0], b.center[1] - anchor[1]));
  return candidates[0]?.name || (anchor[2] === 'land' ? 'Entorno del municipio' : 'Área urbana');
}
