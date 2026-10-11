export const TYPES = [
  { id: 'departamento', label: 'Departamento', group: 'Viviendas', residential: true, photo: 'apartment' },
  { id: 'casa', label: 'Casa', group: 'Viviendas', residential: true, photo: 'house' },
  { id: 'monoambiente', label: 'Monoambiente', group: 'Viviendas', residential: false, photo: 'studio' },
  { id: 'duplex', label: 'Dúplex', group: 'Viviendas', residential: true, photo: 'apartment' },
  { id: 'penthouse', label: 'Penthouse', group: 'Viviendas', residential: true, photo: 'apartment' },
  { id: 'terreno', label: 'Terreno', group: 'Terrenos y campo', residential: false, photo: 'land' },
  { id: 'lote', label: 'Lote en urbanización', group: 'Terrenos y campo', residential: false, photo: 'land' },
  { id: 'quinta', label: 'Quinta', group: 'Terrenos y campo', residential: true, photo: 'house' },
  { id: 'finca', label: 'Propiedad agropecuaria', group: 'Terrenos y campo', residential: false, photo: 'land' },
  { id: 'agricola', label: 'Propiedad agrícola', group: 'Terrenos y campo', residential: false, photo: 'land' },
  { id: 'ganadera', label: 'Propiedad ganadera', group: 'Terrenos y campo', residential: false, photo: 'land' },
  { id: 'oficina', label: 'Oficina', group: 'Comerciales', residential: false, photo: 'commercial' },
  { id: 'local', label: 'Local comercial', group: 'Comerciales', residential: false, photo: 'commercial' },
  { id: 'galpon', label: 'Galpón', group: 'Comerciales', residential: false, photo: 'commercial' },
  { id: 'bodega', label: 'Bodega / depósito', group: 'Comerciales', residential: false, photo: 'commercial' },
  { id: 'proyecto', label: 'Proyecto de construcción', group: 'Proyectos', residential: false, photo: 'project' },
] as const;
export type PropertyType = typeof TYPES[number]['id'];
export const OPERATIONS = { venta: 'Venta', alquiler: 'Alquiler', anticretico: 'Anticrético' };
export type Operation = keyof typeof OPERATIONS;
export const AGENCIES = [
  { id: 'century', logo: '/agencies/century-mark.png', name: 'Century 21', short: 'C21', color: '#A88D56', ink: '#151515', secondary: '#111111' },
  { id: 'remax', logo: '/agencies/remax-mark.png', name: 'RE/MAX', short: 'RE/MAX', color: '#D7282F', ink: '#FFFFFF', secondary: '#16458C' },
  { id: 'kw', logo: '/agencies/kw-mark.png', name: 'Keller Williams', short: 'KW', color: '#B91D28', ink: '#FFFFFF', secondary: '#262626' },
  { id: 'balcon', logo: '/agencies/balcon-mark.png', name: 'Tu Balcón', short: 'TB', color: '#009B6B', ink: '#FFFFFF', secondary: '#303030' },
  { id: 'bien', logo: '/agencies/bien-mark.png', name: 'Bien Inmuebles', short: 'BI', color: '#1875B9', ink: '#FFFFFF', secondary: '#164369' },
  { id: 'vintage', logo: '/agencies/vintage-mark.png', name: 'Vintage', short: 'V', color: '#E79219', ink: '#FFFFFF', secondary: '#151515' },
];
export const OTHER_SOURCES = [
  { id: 'marketplace', name: 'Facebook Marketplace' },
  { id: 'deber', name: 'El Deber · Llave en Mano' },
  { id: 'links', name: 'Otros enlaces y redes' },
];
export const ALL_SOURCES = [...AGENCIES, ...OTHER_SOURCES];
// Municipal seats: OpenStreetMap named city/town/village nodes (October 2026 snapshot).
export const MUNICIPALITIES = [
  { name: 'Santa Cruz de la Sierra', lng: -63.1820853, lat: -17.7834217 },
  { name: 'Porongo', lng: -63.3083484, lat: -17.8529097 },
  { name: 'Warnes', lng: -63.1647184, lat: -17.5100818 },
  { name: 'Cotoca', lng: -62.9962235, lat: -17.7545038 },
  { name: 'Montero', lng: -63.2557687, lat: -17.3420202 },
  { name: 'La Guardia', lng: -63.3310809, lat: -17.8919353 },
  { name: 'El Torno', lng: -63.3826134, lat: -17.9918059 },
  { name: 'Buena Vista', lng: -63.6606221, lat: -17.4601261 },
  { name: 'Yapacaní', lng: -63.8812325, lat: -17.4022838 },
  { name: 'Samaipata', lng: -63.8759138, lat: -18.1796658 },
  { name: 'Vallegrande', lng: -64.1081091, lat: -18.4894001 },
  { name: 'Camiri', lng: -63.5203507, lat: -20.0390682 },
  { name: 'Concepción', lng: -62.0239275, lat: -16.1349051 },
  { name: 'San Ignacio de Velasco', lng: -60.9598466, lat: -16.3738881 },
  { name: 'San José de Chiquitos', lng: -60.7422053, lat: -17.8454524 },
  { name: 'Roboré', lng: -59.7561842, lat: -18.3306352 },
  { name: 'Puerto Suárez', lng: -57.7974552, lat: -18.9631791 },
  { name: 'San Matías', lng: -58.4001944, lat: -16.3598435 },
  { name: 'Ascensión de Guarayos', lng: -63.1876907, lat: -15.8966537 },
  { name: 'Boyuibe', lng: -63.2815357, lat: -20.4318294 },
  { name: 'Cabezas', lng: -63.3173957, lat: -18.7872928 },
  { name: 'Charagua Iyambae', lng: -63.2004721, lat: -19.7917288 },
  { name: 'Colpa Bélgica', lng: -63.2251773, lat: -17.5650284 },
  { name: 'Comarapa', lng: -64.5295941, lat: -17.9136428 },
  { name: 'Cuatro Cañadas', lng: -62.5571442, lat: -17.2663127 },
  { name: 'Cuevo', lng: -63.5187489, lat: -20.4545939 },
  { name: 'El Carmen Rivero Tórrez', lng: -58.6242576, lat: -18.8273646 },
  { name: 'El Puente', lng: -62.9105527, lat: -16.3298403 },
  { name: 'Fernández Alonso', lng: -63.23234, lat: -17.0097948 },
  { name: 'General Agustín Saavedra', lng: -63.2143516, lat: -17.2250784 },
  { name: 'Gutiérrez', lng: -63.529696, lat: -19.4227691 },
  { name: 'Lagunillas', lng: -63.6759479, lat: -19.6517736 },
  { name: 'Mairana', lng: -63.9563621, lat: -18.1193379 },
  { name: 'Mineros', lng: -63.2332727, lat: -17.1175579 },
  { name: 'Moro Moro', lng: -64.3236374, lat: -18.3663622 },
  { name: 'Okinawa I', lng: -62.8946437, lat: -17.2187172 },
  { name: 'Pailón', lng: -62.7197122, lat: -17.6596808 },
  { name: 'Pampa Grande', lng: -64.1125151, lat: -18.0895573 },
  { name: 'Portachuelo', lng: -63.3946477, lat: -17.3545949 },
  { name: 'Postrer Valle', lng: -63.8351805, lat: -18.4909496 },
  { name: 'Pucará', lng: -64.1844365, lat: -18.7149205 },
  { name: 'Puerto Quijarro', lng: -57.7157091, lat: -19.0044088 },
  { name: 'Quirusillas', lng: -63.9461345, lat: -18.3348864 },
  { name: 'Saipina', lng: -64.5858227, lat: -18.0798358 },
  { name: 'San Antonio de Lomerío', lng: -61.8102698, lat: -16.7684973 },
  { name: 'San Carlos', lng: -63.7324754, lat: -17.4044038 },
  { name: 'San Javier', lng: -62.5044287, lat: -16.2739191 },
  { name: 'San Juan', lng: -63.8470843, lat: -17.2915516 },
  { name: 'San Julián', lng: -62.6153727, lat: -16.910497 },
  { name: 'San Miguel de Velasco', lng: -60.9680716, lat: -16.6979999 },
  { name: 'San Pedro', lng: -63.482406, lat: -16.8260222 },
  { name: 'San Rafael de Velasco', lng: -60.6750906, lat: -16.7868211 },
  { name: 'San Ramón', lng: -62.500201, lat: -16.6151671 },
  { name: 'Santa Rosa del Sara', lng: -63.5990338, lat: -17.1096766 },
  { name: 'Trigal', lng: -64.1492826, lat: -18.306043 },
  { name: 'Urubichá', lng: -63.0841318, lat: -15.6282387 },
];
// Curated common search areas, rather than a measured popularity ranking.
export const SEARCH_ZONES = [
  { id: 'Equipetrol', label: 'Equipetrol', municipality: 'Santa Cruz de la Sierra' },
  { id: 'Equipetrol Norte', label: 'Equipetrol Norte', municipality: 'Santa Cruz de la Sierra' },
  { id: 'Urubó', label: 'Urubó', municipality: 'Porongo' },
  { id: 'Las Palmas', label: 'Las Palmas', municipality: 'Santa Cruz de la Sierra' },
  { id: 'Sirari', label: 'Sirari', municipality: 'Santa Cruz de la Sierra' },
  { id: 'Urbarí', label: 'Urbarí', municipality: 'Santa Cruz de la Sierra' },
  { id: 'Hamacas', label: 'Hamacas', municipality: 'Santa Cruz de la Sierra' },
  { id: 'Zona Norte', label: 'Zona Norte', municipality: 'Santa Cruz de la Sierra' },
  { id: 'Centro', label: 'Centro', municipality: 'Santa Cruz de la Sierra' },
  { id: 'Urbanización El Remanso', label: 'El Remanso', municipality: 'Santa Cruz de la Sierra' },
  { id: 'Los Mangales', label: 'Los Mangales', municipality: 'Santa Cruz de la Sierra' },
  { id: 'Santa Rosita', label: 'Santa Rosita', municipality: 'Santa Cruz de la Sierra' },
  { id: 'El Trompillo', label: 'El Trompillo', municipality: 'Santa Cruz de la Sierra' },
  { id: 'Barrio La Ramada', label: 'La Ramada', municipality: 'Santa Cruz de la Sierra' },
  { id: 'El Pari', label: 'El Pari', municipality: 'Santa Cruz de la Sierra' },
  { id: 'Villa 1 de Mayo', label: 'Villa Primero de Mayo', municipality: 'Santa Cruz de la Sierra' },
  { id: 'Pampa de la Isla', label: 'Pampa de la Isla', municipality: 'Santa Cruz de la Sierra' },
  { id: 'Plan 3000', label: 'Plan 3000', municipality: 'Santa Cruz de la Sierra' },
  { id: 'El Bajío', label: 'El Bajío', municipality: 'Santa Cruz de la Sierra' },
  { id: 'Palmasola', label: 'Palmasola', municipality: 'Santa Cruz de la Sierra' },
];
export const AMENITIES = [
  { id: 'parking', label: 'Estacionamiento' }, { id: 'pool', label: 'Piscina / alberca' },
  { id: 'pets', label: 'Acepta mascotas' }, { id: 'furnished', label: 'Amoblado' },
  { id: 'balcony', label: 'Balcón' }, { id: 'garden', label: 'Jardín' },
  { id: 'security', label: 'Seguridad' }, { id: 'elevator', label: 'Ascensor' },
  { id: 'accessible', label: 'Acceso sin escalones' }, { id: 'services', label: 'Servicios básicos' },
];
export type Filters = {
  type: PropertyType | ''; operation: Operation; bedrooms: string; bathrooms: string;
  municipality: string; zone: string; currency: 'USD' | 'BOB'; minPrice: string; maxPrice: string;
  minArea: string; maxArea: string; amenities: string[]; sources: string[]; details: string;
};
export const DEFAULT_FILTERS: Filters = {
  type: '', operation: 'venta', bedrooms: '', bathrooms: '', municipality: 'all', zone: '',
  currency: 'USD', minPrice: '', maxPrice: '', minArea: '', maxArea: '', amenities: [],
  sources: ALL_SOURCES.map(s => s.id), details: '',
};
export type Property = {
  id: string; title: string; type: PropertyType; operation: Operation; price: number; currency: 'USD'|'BOB';
  municipality: string; zone: string; area: number; bedrooms: number | null; bathrooms: number | null;
  amenities: string[]; source: string; confirmed: boolean; coordinates: [number, number] | null;
  photo: string; photoIndex?: number; description: string; extras: string; reference: string;
  publicationContact?: PublicationContact;
};
export type PublicationContact = { name?: string; phone?: string; messengerDemo?: boolean; messengerUrl?: string };
export type SearchResult = {
  id: string; filters: Filters; interpreted: string[]; properties: Property[]; createdAt: string;
};
export type HistoryEntry = { id: string; filters: Filters; createdAt: string; count: number };
export type Profile = { company: string; advisor: string; plan: string; paymentMethod?: string; activatedAt?: string };
export type Workspace = { profile: Profile; favorites: Property[]; history: HistoryEntry[] };
export const PLANS = [
  { id: 'inicial', name: 'Inicial', price: 149, users: 2, description: 'Para comenzar con tu equipo.' },
  { id: 'equipo', name: 'Equipo', price: 299, users: 5, description: 'Más asesores, un mismo buscador.' },
  { id: 'empresa', name: 'Empresa', price: 499, users: 10, description: 'Para una inmobiliaria en crecimiento.' },
];
export const typeLabel = (id: string) => TYPES.find(t => t.id === id)?.label || id;
export const sourceLabel = (id: string) => ALL_SOURCES.find(s => s.id === id)?.name || id;
export const money = (value: number, currency: 'USD'|'BOB') => `${currency === 'USD' ? '$us' : 'Bs'} ${new Intl.NumberFormat('es-BO', {maximumFractionDigits:2}).format(value)}`;
export const photoURL = (name: string) => `/photos/${name}.webp`;
export const searchLabel = (f: Filters) => `${typeLabel(f.type)} · ${OPERATIONS[f.operation]}${f.bedrooms && f.bedrooms !== '0' ? ` · ${f.bedrooms} dorm.` : ''}`;
