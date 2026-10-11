'use client';
import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel';
import { Button } from '@/components/ui/button';
import { OPERATIONS, type Property } from '@/lib/tucasa';
import PropertyImage from './property-image';

const captions: Record<string, string[]> = {
  apartment: ['Sala y comedor', 'Edificio', 'Cocina'],
  house: ['Fachada', 'Sala', 'Cocina'],
  studio: ['Ambiente integrado', 'Edificio', 'Cocina y detalles'],
  commercial: ['Espacio interior', 'Fachada', 'Otra vista interior'],
  land: ['Terreno', 'Acceso', 'Vista del terreno'],
  project: ['Vista exterior', 'Espacios interiores', 'Otra vista interior'],
};
export default function PropertyGallery({ property }: { property: Property }) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const labels = captions[property.photo] || captions.house;
  useEffect(() => {
    if (!api) return;
    const update = () => setCurrent(api.selectedScrollSnap());
    update(); api.on('select', update);
    return () => { api.off('select', update); };
  }, [api]);
  return <div className="property-gallery">
    <Carousel setApi={setApi} opts={{ loop: true }} className="gallery-carousel" aria-label={`Fotos de ${property.title}`}>
      <CarouselContent>{labels.map((label, i) => <CarouselItem key={label}><div className="gallery-photo"><PropertyImage property={property} view={i} loading={i === 0 ? 'eager' : 'lazy'} /></div></CarouselItem>)}</CarouselContent>
      <span className="operation-badge">{OPERATIONS[property.operation]}</span>
      <Button variant="outline" size="icon" className="gallery-arrow gallery-prev" aria-label="Foto anterior" onClick={() => api?.scrollPrev()}><ChevronLeft size={22} /></Button>
      <Button variant="outline" size="icon" className="gallery-arrow gallery-next" aria-label="Foto siguiente" onClick={() => api?.scrollNext()}><ChevronRight size={22} /></Button>
      <span className="gallery-counter" aria-live="polite">{labels[current]} · {current + 1} / {labels.length}</span>
    </Carousel>
    <div className="gallery-thumbnails">{labels.map((label, i) => <button key={label} className={current === i ? 'selected' : ''} onClick={() => api?.scrollTo(i)} aria-label={`Ver ${label.toLowerCase()}`} aria-pressed={current === i}><span className="thumbnail-photo"><PropertyImage property={property} view={i} /></span><span>{label}</span></button>)}</div>
  </div>;
}
