'use client';
import { useEffect, useRef, useState } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Expand, LocateFixed, Layers, X, AlertCircle, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AGENCIES, money, type Property } from '@/lib/tucasa';
import PropertyCard from './property-card';
import AgencyLogo, { recoverAgencyLogo } from './agency-logo';

const DEPARTMENT: [[number, number], [number, number]] = [[-20.54, -65.53], [-13.25, -57.39]];
type Props = { properties: Property[]; favorites: Property[]; municipality: string; zone: string; onFavorite: (p: Property) => void; onOpen: (p: Property) => void };

export default function PropertyMap({ properties, favorites, municipality, zone, onFavorite, onOpen }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const [selected, setSelected] = useState<Property | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  function fitMatches() {
    const coordinates = properties.filter(p => p.coordinates).map(p => p.coordinates!);
    if (!mapRef.current || !coordinates.length) return;
    const lng = coordinates.map(c => c[0]), lat = coordinates.map(c => c[1]);
    mapRef.current.fitBounds([[Math.min(...lat) - .0008, Math.min(...lng) - .0008], [Math.max(...lat) + .0008, Math.max(...lng) + .0008]], { padding: [65, 80], maxZoom: zone ? 16 : 14, animate: true });
  }

  useEffect(() => {
    let cancelled = false;
    let resize: ResizeObserver | undefined;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const controller = new AbortController();
    setLoaded(false); setSelected(null); setError('');
    import('leaflet').then(module => {
      if (cancelled || !container.current) return;
      const L = module;
      const map = L.map(container.current, { zoomControl: false, scrollWheelZoom: true, minZoom: 4, maxZoom: 18, maxBounds: [[-25, -72], [-8, -50]], maxBoundsViscosity: .8 });
      mapRef.current = map;
      L.control.zoom({ position: 'topright' }).addTo(map);
      map.attributionControl.setPrefix(false);
      map.fitBounds(DEPARTMENT, { padding: [35, 35] });
      const tiles = L.tileLayer('/api/map/{z}/{x}/{y}', { minZoom: 4, maxZoom: 18, keepBuffer: 2, updateWhenIdle: true, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>' });
      let successes = 0;
      tiles.on('tileload', () => { successes++; if (!cancelled) { setLoaded(true); setError(''); } });
      tiles.on('load', () => { if (!cancelled && successes === 0) { setError('No se pudo cargar el mapa. Vuelve a intentarlo.'); } });
      tiles.addTo(map);
      timeout = setTimeout(() => { if (!cancelled && successes === 0) setError('La carga del mapa está tardando. Vuelve a intentarlo.'); }, 20000);
      fetch('/santa-cruz.geojson', { signal: controller.signal }).then(r => { if (!r.ok) throw new Error('Boundary unavailable'); return r.json(); }).then(data => {
        if (!cancelled) L.geoJSON(data as Parameters<typeof L.geoJSON>[0], { interactive: false, style: { color: '#174B3B', weight: 1.5, opacity: .65, fillColor: '#174B3B', fillOpacity: .035, dashArray: '5 4' } }).addTo(map);
      }).catch(() => { /* The basemap and property pins remain usable. */ });
      for (const property of properties) {
        if (!property.coordinates) continue;
        const agency = AGENCIES.find(a => a.id === property.source);
        if (!agency) continue;
        const element = document.createElement('button');
        element.className = 'map-price-pin'; element.type = 'button';
        element.style.setProperty('--pin-color', agency.color); element.style.setProperty('--pin-ink', agency.ink); element.style.setProperty('--pin-secondary', agency.secondary);
        element.setAttribute('aria-label', `${property.title}, ${money(property.price, property.currency)}, ${agency.name}`);
        element.title = `${agency.name} · ${property.municipality}`;
        const mark = document.createElement('span'); mark.className = `pin-logo agency-logo-${agency.id}`;
        const logo = document.createElement('img'); logo.src = agency.logo; logo.alt = ''; logo.width = 22; logo.height = 22;
        logo.style.width = '22px'; logo.style.height = '22px'; logo.style.maxWidth = '22px'; logo.style.maxHeight = '22px'; logo.style.objectFit = 'contain';
        logo.addEventListener('error', () => recoverAgencyLogo(logo, agency.id)); mark.appendChild(logo);
        const price = document.createElement('span'); price.className = 'pin-price'; price.textContent = money(property.price, property.currency);
        element.appendChild(mark); element.appendChild(price);
        element.addEventListener('click', event => { event.stopPropagation(); setSelected(property); map.panTo([property.coordinates![1], property.coordinates![0]], { animate: true }); });
        L.marker([property.coordinates[1], property.coordinates[0]], { icon: L.divIcon({ html: element, className: 'agency-map-marker', iconSize: [148, 43], iconAnchor: [18, 43] }), keyboard: false }).addTo(map);
      }
      if (municipality !== 'all' || zone) fitMatches();
      resize = new ResizeObserver(() => map.invalidateSize({ pan: false })); resize.observe(container.current);
    }).catch(() => { if (!cancelled) setError('No se pudo iniciar el mapa. Vuelve a cargarlo.'); });
    return () => { cancelled = true; controller.abort(); resize?.disconnect(); if (timeout) clearTimeout(timeout); mapRef.current?.remove(); mapRef.current = null; };
  }, [properties, municipality, zone, retry]);

  return <div className="map-workspace">
    <div className="map-stage">
      <div className="map-canvas" ref={container} aria-label="Mapa interactivo del departamento de Santa Cruz" />
      {!loaded && !error && <div className="map-loading"><LoaderCircle className="rotating" size={23} /><span>Cargando mapa…</span></div>}
      {error && <div className="map-error" role="alert"><AlertCircle size={23} /><strong>No pudimos cargar el mapa</strong><p>{error}</p><Button className="primary-button" onClick={() => setRetry(r => r + 1)}>Volver a cargar</Button></div>}
      <div className="map-info"><MapPin size={16} /><div><strong>{zone || (municipality === 'all' ? 'Departamento de Santa Cruz' : municipality)}</strong><span>{properties.length} inmuebles</span></div></div>
      <div className="map-tools"><Button variant="outline" className="map-tool" onClick={() => mapRef.current?.fitBounds(DEPARTMENT, { padding: [35, 35], animate: true })}><Expand size={16} /><span>Todo el departamento</span></Button><Button variant="outline" className="map-tool" onClick={fitMatches} disabled={!properties.length}><LocateFixed size={16} /><span>Ver coincidencias</span></Button></div>
      {selected && <div className="map-property-preview"><Button variant="ghost" size="icon" className="preview-close" onClick={() => setSelected(null)} aria-label="Cerrar inmueble"><X size={16} /></Button><PropertyCard property={selected} saved={favorites.some(p => p.id === selected.id)} onFavorite={onFavorite} onOpen={onOpen} compact /></div>}
      {!properties.length && <div className="map-empty"><MapPin size={26} /><strong>No hay ubicaciones confirmadas.</strong><p>Prueba otra zona o ajusta la búsqueda.</p></div>}
    </div>
    <div className="map-legend"><div className="legend-heading"><Layers size={16} />Inmobiliarias</div><div className="legend-list">{AGENCIES.filter(agency => properties.some(p => p.source === agency.id)).map(agency => <div key={agency.id}><AgencyLogo agency={agency}/><span>{agency.name}</span><small>{properties.filter(p => p.source === agency.id).length}</small></div>)}</div></div>
    <details className="accessible-map-results"><summary>Ver inmuebles en una lista</summary><div>{properties.map(p => <button key={p.id} onClick={() => onOpen(p)}>{p.title} · {p.municipality} · {money(p.price, p.currency)}</button>)}</div></details>
  </div>;
}
