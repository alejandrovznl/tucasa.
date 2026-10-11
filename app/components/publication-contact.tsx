'use client';

import { useId, useState } from 'react';
import { Copy, MessageCircle, Phone, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { OTHER_SOURCES, money, type Property } from '@/lib/tucasa';
import { validatedMessengerUrl } from '@/lib/publication-contacts';

export default function PublicationContact({ property }: { property: Property }) {
  const contact = property.publicationContact;
  const fieldId = useId();
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [message, setMessage] = useState(`Hola, me interesa ${property.title.toLowerCase()} en ${property.zone}. Vi el precio de ${money(property.price, property.currency)}${property.operation === 'alquiler' ? ' por mes' : ''}. ¿Sigue disponible? Referencia: ${property.reference}.`);
  if (property.confirmed || !OTHER_SOURCES.some(source => source.id === property.source) || !contact || (!contact.name && !contact.phone && !contact.messengerDemo && !contact.messengerUrl)) return null;
  const messengerUrl = property.source === 'marketplace' ? validatedMessengerUrl(contact) : null;
  const hasMessenger = property.source === 'marketplace' && (messengerUrl || contact.messengerDemo);

  async function copy(text: string, label: string) {
    try { await navigator.clipboard.writeText(text); setFeedback(label); }
    catch { setFeedback('Puedes seleccionar el texto y copiarlo manualmente.'); }
  }

  return <section className="publication-contact" aria-label="Contacto de la publicación">
    <div className="publication-contact-information">
      {contact.name && <div><span>{property.source === 'marketplace' ? 'Publicado por' : 'Nombre de contacto'}</span><strong>{contact.name}</strong></div>}
      {contact.phone && <div><span>Teléfono de referencia</span><strong><Phone size={15} />{contact.phone}</strong></div>}
    </div>
    <div className="publication-contact-actions">
      {contact.phone && <Button variant="outline" size="sm" onClick={() => void copy(contact.phone!, 'Teléfono copiado.')}><Copy size={14} />Copiar teléfono</Button>}
      {hasMessenger && (messengerUrl ? <Button asChild className="messenger-button" size="sm"><a href={messengerUrl} target="_blank" rel="noopener noreferrer"><MessageCircle size={16} />Messenger</a></Button> : <Button className="messenger-button" size="sm" onClick={() => { setFeedback(''); setOpen(true); }}><MessageCircle size={16} />Messenger</Button>)}
    </div>
    {feedback && !open && <p className="publication-contact-feedback" role="status">{feedback}</p>}
    <Dialog open={open} onOpenChange={setOpen}><DialogContent showCloseButton={false} className="messenger-preview-dialog"><DialogClose className="dialog-close" aria-label="Cerrar Messenger"><X size={20} /></DialogClose>
      <DialogHeader><span className="messenger-preview-icon"><MessageCircle size={23} /></span><DialogTitle>Messenger</DialogTitle><DialogDescription>{contact.name || 'Contacto de la publicación'} · Facebook Marketplace</DialogDescription></DialogHeader>
      <div className="messenger-property-summary"><strong>{property.title}</strong><span>{property.zone} · {money(property.price, property.currency)}</span></div>
      <label htmlFor={fieldId}>Tu mensaje</label><textarea id={fieldId} value={message} onChange={event => { setMessage(event.target.value); setFeedback(''); }} maxLength={1500} rows={5} />
      <Button className="messenger-button" disabled={!message.trim()} onClick={() => void copy(message.trim(), 'Mensaje copiado.')}><Copy size={16} />Copiar mensaje</Button>
      {feedback && <p className="publication-contact-feedback" role="status">{feedback}</p>}
      <p className="messenger-preview-note">Vista de prueba. No se envían mensajes a Facebook.</p>
    </DialogContent></Dialog>
  </section>;
}
