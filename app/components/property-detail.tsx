'use client';

import { useState } from 'react';
import { Bath, BedDouble, CarFront, Check, Heart, MapPin, ReceiptText, Ruler, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AMENITIES, OPERATIONS, money, sourceLabel, typeLabel, type Property } from '@/lib/tucasa';
import { hasPropertyAdvisor } from '@/lib/property-advisors';
import PropertyGallery from './property-gallery';
import PropertyAdvisor from './property-advisor';
import PublicationContact from './publication-contact';
import { PropertyFacts, SourceBadge } from './property-card';

export default function PropertyDetail({ property: p, saved, onFavorite, onNotice }: { property: Property; saved: boolean; onFavorite: (property: Property) => void; onNotice: (message: string) => void }) {
  const [publication, setPublication] = useState(false);
  const showAdvisor = hasPropertyAdvisor(p);
  const isLand = p.photo === 'land';
  const facts = [
    { label: 'Tipo de inmueble', value: typeLabel(p.type) },
    { label: 'Operación', value: OPERATIONS[p.operation] },
    { label: `Precio de ${OPERATIONS[p.operation].toLowerCase()}`, value: money(p.price, p.currency) + (p.operation === 'alquiler' ? ' / mes' : '') },
    { label: isLand ? 'Superficie del terreno' : 'Superficie', value: `${p.area.toLocaleString('es-BO')} m²` },
    { label: 'Zona / barrio', value: p.zone },
    { label: 'Municipio', value: p.municipality },
    { label: 'Origen', value: sourceLabel(p.source) },
    { label: 'Referencia', value: p.reference },
  ];

  async function copyProperty() {
    const text = `TuCasa\n${p.title}\n${money(p.price, p.currency)}${p.operation === 'alquiler' ? ' / mes' : ''}\n${p.zone}, ${p.municipality}\n${p.description}\nOrigen: ${sourceLabel(p.source)}\n${p.reference}`;
    try { await navigator.clipboard.writeText(text); onNotice('Ficha copiada.'); }
    catch { onNotice('Tu navegador no permite copiar automáticamente.'); }
  }

  const locationStatus = <div className={`location-status ${p.confirmed ? '' : 'unconfirmed'}`}><MapPin size={18} /><div><strong>{p.confirmed ? 'Ubicación confirmada' : 'Ubicación sin confirmar'}</strong><p>{p.confirmed ? `${p.zone}, ${p.municipality}` : 'La publicación no indica una dirección exacta.'}</p></div></div>;

  return <div className={showAdvisor ? 'property-detail-layout' : 'property-detail-legacy'}>
    <div className="property-main-column">
      <PropertyGallery property={p} />
      <div className="detail-content">
        <SourceBadge source={p.source} />
        <DialogHeader><DialogTitle>{publication ? 'Publicación' : p.title}</DialogTitle><DialogDescription>{p.zone}, {p.municipality} · Ref. {p.reference}</DialogDescription></DialogHeader>
        <div className="detail-price-row"><strong>{money(p.price, p.currency)}{p.operation === 'alquiler' && <small>/ mes</small>}</strong><Button variant="outline" className={saved ? 'saved-detail' : ''} onClick={() => onFavorite(p)} aria-pressed={saved}><Heart size={16} fill={saved ? 'currentColor' : 'none'} />{saved ? 'Guardado' : 'Guardar'}</Button></div>
        {showAdvisor ? <dl className="detail-key-facts" aria-label="Características principales">
          <div><dt>{isLand ? 'Terreno' : 'Superficie'}</dt><dd><Ruler size={18} />{p.area.toLocaleString('es-BO')} m²</dd></div>
          {p.bedrooms !== null && <div><dt>Dormitorios</dt><dd><BedDouble size={18} />{p.bedrooms === 0 ? 'Integrado' : p.bedrooms}</dd></div>}
          {p.bathrooms !== null && <div><dt>Baños</dt><dd><Bath size={18} />{p.bathrooms}</dd></div>}
          {p.amenities.includes('parking') && <div><dt>Estacionamiento</dt><dd><CarFront size={18} />Incluido</dd></div>}
        </dl> : <PropertyFacts property={p} />}
        {!showAdvisor && locationStatus}
        <h3>{publication ? `Texto del anuncio · ${sourceLabel(p.source)}` : 'Descripción'}</h3>
        <p className="detail-description">{p.description}</p>
        {!showAdvisor && <PublicationContact key={p.id} property={p} />}
        {showAdvisor && <section className="detail-specifications" aria-label="Información del inmueble"><h3>Información del inmueble</h3><dl>{facts.map(fact => <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl></section>}
        {p.amenities.length > 0 && <><h3>Características</h3><div className="detail-amenities">{p.amenities.map(id => <span key={id}><Check size={14} />{AMENITIES.find(a => a.id === id)?.label}</span>)}</div></>}
        {showAdvisor && locationStatus}
        {p.extras && <div className="client-requirements"><Sparkles size={16} /><div><strong>Detalles que solicitaste</strong><p>{p.extras}</p></div></div>}
        <div className="detail-actions"><Button className="primary-button" onClick={() => setPublication(!publication)}>{publication ? 'Volver a la ficha' : 'Ver publicación'}</Button><Button variant="outline" onClick={copyProperty}><ReceiptText size={16} />Copiar ficha</Button></div>
      </div>
    </div>
    {showAdvisor && <PropertyAdvisor key={p.id} property={p} />}
  </div>;
}
