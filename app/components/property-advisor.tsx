'use client';

import { useId, useState, type FormEvent } from 'react';
import { Check, Copy, Mail, Phone, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { money, type Property } from '@/lib/tucasa';
import { advisorForProperty } from '@/lib/property-advisors';
import { SourceBadge } from './property-card';

export default function PropertyAdvisor({ property }: { property: Property }) {
  const advisor = advisorForProperty(property);
  const formId = useId();
  const [phoneVisible, setPhoneVisible] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(`Hola, me interesa ${property.title.toLowerCase()} en ${property.zone}. Referencia: ${property.reference}. Precio: ${money(property.price, property.currency)}${property.operation === 'alquiler' ? ' por mes' : ''}. Quisiera conocer más detalles y consultar sobre una visita.`);
  const [draft, setDraft] = useState('');
  const [feedback, setFeedback] = useState('');

  function prepareInquiry(event: FormEvent) {
    event.preventDefault();
    if (!message.trim()) { setFeedback('Escribe tu consulta antes de continuar.'); return; }
    setDraft([
      `Consulta para ${advisor.name}`,
      `${property.title} · ${property.reference}`,
      `${property.zone}, ${property.municipality}`,
      money(property.price, property.currency) + (property.operation === 'alquiler' ? ' / mes' : ''),
      '', message.trim(), '',
      ...[
        name.trim() && `Nombre: ${name.trim()}`,
        phone.trim() && `Teléfono: ${phone.trim()}`,
        email.trim() && `Email: ${email.trim()}`,
      ].filter(Boolean),
    ].join('\n').trim());
    setFeedback('');
  }

  async function copyInquiry() {
    try { await navigator.clipboard.writeText(draft); setFeedback('Consulta copiada.'); }
    catch { setFeedback('Selecciona el texto de la consulta y cópialo manualmente.'); }
  }

  return <aside className="property-advisor-column" aria-labelledby={`${formId}-heading`}>
    <section className="property-advisor-card">
      <div className="advisor-card-body">
        <h2 id={`${formId}-heading`}>¿Necesitas más información?</h2>
        <div className="advisor-profile">
          <div className="advisor-portrait-frame"><img src={advisor.photo} alt={`Retrato de ${advisor.name}`} width={144} height={144} decoding="async" /></div>
          <h3>{advisor.name}</h3>
          <span className="advisor-role">{advisor.role}</span>
          <p className="advisor-presentation">{advisor.presentation}</p>
        </div>
        <div className="advisor-phone-row">
          <span className="advisor-phone" aria-live="polite">{phoneVisible ? advisor.phone : advisor.maskedPhone}</span>
          <Button type="button" variant="outline" className="advisor-phone-button" onClick={() => setPhoneVisible(!phoneVisible)} aria-expanded={phoneVisible} aria-label={`${phoneVisible ? 'Ocultar' : 'Ver'} teléfono de ${advisor.name}`}><Phone size={15} />{phoneVisible ? 'Ocultar' : 'Ver teléfono'}</Button>
        </div>
        <div className="advisor-email"><Mail size={14} /><span>{advisor.email}</span></div>
        {draft ? <div className="advisor-inquiry-ready">
          <h3><Check size={17} />Consulta preparada</h3>
          <p>Puedes copiarla para compartirla con el contacto del inmueble.</p>
          <label className="sr-only" htmlFor={`${formId}-draft`}>Texto de la consulta preparada</label>
          <textarea id={`${formId}-draft`} readOnly value={draft} rows={7} />
          <Button type="button" className="primary-button" onClick={copyInquiry}><Copy size={16} />Copiar consulta</Button>
          <Button type="button" variant="ghost" onClick={() => { setDraft(''); setFeedback(''); }}>Editar consulta</Button>
        </div> : <form className="advisor-inquiry-form" onSubmit={prepareInquiry}>
          <div className="advisor-form-pair">
            <div className="advisor-field"><label htmlFor={`${formId}-name`}>Nombre</label><input id={`${formId}-name`} autoComplete="name" maxLength={80} value={name} onChange={event => setName(event.target.value)} placeholder="Tu nombre" /></div>
            <div className="advisor-field"><label htmlFor={`${formId}-phone`}>Teléfono</label><input id={`${formId}-phone`} type="tel" autoComplete="tel" maxLength={30} value={phone} onChange={event => setPhone(event.target.value)} placeholder="Tu teléfono" /></div>
          </div>
          <div className="advisor-field"><label htmlFor={`${formId}-email`}>Email</label><input id={`${formId}-email`} type="email" autoComplete="email" maxLength={120} value={email} onChange={event => setEmail(event.target.value)} placeholder="Tu correo electrónico" /></div>
          <div className="advisor-field"><label htmlFor={`${formId}-message`}>Mensaje</label><textarea id={`${formId}-message`} required maxLength={1500} rows={4} value={message} onChange={event => { setMessage(event.target.value); setFeedback(''); }} /></div>
          <Button type="submit" className="primary-button"><Send size={16} />Preparar consulta</Button>
        </form>}
        {feedback && <p className="advisor-feedback" role="status">{feedback}</p>}
      </div>
      <div className="advisor-card-source"><SourceBadge source={property.source} /></div>
    </section>
  </aside>;
}
