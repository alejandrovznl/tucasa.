'use client';
import { useRef, type FormEvent } from 'react';
import { Search, SlidersHorizontal, Sparkles, ShieldCheck, AlertCircle, RotateCcw, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AGENCIES, AMENITIES, DEFAULT_FILTERS, MUNICIPALITIES, SEARCH_ZONES, OPERATIONS, OTHER_SOURCES, TYPES, type Filters } from '@/lib/tucasa';

import AgencyLogo from './agency-logo';

type Props={filters:Filters;setFilters:(f:Filters)=>void;onSearch:(f:Filters)=>Promise<unknown>;loading:boolean;errors:string[];onClearErrors:()=>void};
export function Choice({value,onChange,placeholder,items,id,disabled=false}:{value:string;onChange:(v:string)=>void;placeholder?:string;items:{id:string;label:string}[];id:string;disabled?:boolean}){
  return <Select value={value||undefined} onValueChange={onChange} disabled={disabled}><SelectTrigger id={id} className="form-select"><SelectValue placeholder={placeholder}/></SelectTrigger><SelectContent position="popper">{items.map(i=><SelectItem key={i.id} value={i.id}>{i.label}</SelectItem>)}</SelectContent></Select>;
}
export default function SearchForm({filters:f,setFilters,onSearch,loading,errors,onClearErrors}:Props){
  const errorRef=useRef<HTMLDivElement>(null);
  const change=<K extends keyof Filters>(key:K,value:Filters[K])=>{setFilters({...f,[key]:value});onClearErrors();};
  const toggle=(key:'amenities'|'sources',id:string)=>change(key,f[key].includes(id)?f[key].filter(s=>s!==id):[...f[key],id]);
  const spec=TYPES.find(t=>t.id===f.type);const isLand=['terreno','lote','finca','agricola','ganadera'].includes(f.type);
  const submit=async(e:FormEvent)=>{e.preventDefault();await onSearch(f);setTimeout(()=>errorRef.current?.scrollIntoView({behavior:'smooth',block:'center'}),30);};
  const setType=(value:string)=>{setFilters({...f,type:value as Filters['type'],bedrooms:value==='monoambiente'?'0':TYPES.find(t=>t.id===value)?.residential?f.bedrooms==='0'?'':f.bedrooms:'',bathrooms:['terreno','lote','finca','agricola','ganadera'].includes(value)?'':f.bathrooms});onClearErrors();};
  return <main className="search-page">
    <div className="page-intro"><h1>Mayores posibilidades de búsqueda</h1></div>
    <div className="search-layout">
    <form onSubmit={submit} className="search-form" noValidate>
      <section className="form-section first-section"><div className="section-title"><span className="step-number">01</span><div><h2>¿Qué está buscando tu cliente?</h2></div><span className="required-caption">* Obligatorio</span></div>
        <div className="essentials-grid"><div className="field"><label htmlFor="property-type">Tipo de inmueble <b>*</b></label><Select value={f.type||undefined} onValueChange={setType}><SelectTrigger id="property-type" className="form-select"><SelectValue placeholder="Selecciona un inmueble"/></SelectTrigger><SelectContent position="popper">{['Viviendas','Terrenos y campo','Comerciales','Proyectos'].map(group=><SelectGroup key={group}><SelectLabel>{group}</SelectLabel>{TYPES.filter(t=>t.group===group).map(t=><SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}</SelectGroup>)}</SelectContent></Select></div>
        <div className="field operation-field"><label id="operation-label">Tipo de operación <b>*</b></label><RadioGroup className="operation-options" aria-labelledby="operation-label" value={f.operation} onValueChange={v=>change('operation',v as Filters['operation'])}>{Object.entries(OPERATIONS).map(([id,name])=><label className={f.operation===id?'operation selected':'operation'} key={id}><RadioGroupItem value={id} id={`operation-${id}`}/><span>{name}</span></label>)}</RadioGroup></div></div>
        <div className="fields-grid three-cols"><div className="field"><label htmlFor="bedrooms">Dormitorios {spec?.residential&&<b>*</b>}</label><Choice id="bedrooms" value={f.type==='monoambiente'?'0':f.bedrooms} onChange={v=>change('bedrooms',v==='any'?'':v)} placeholder={isLand?'No corresponde':spec?.residential?'Selecciona la cantidad':'Opcional'} disabled={isLand||['oficina','local','galpon','monoambiente'].includes(f.type)} items={f.type==='monoambiente'?[{id:'0',label:'Ambiente integrado'}]:[...(!spec?.residential?[{id:'any',label:'Sin preferencia'}]:[]),...Array.from({length:10},(_,i)=>({id:String(i+1),label:`${i+1} ${i===0?'dormitorio':'dormitorios'}`}))]}/></div>
          <div className="field"><label htmlFor="bathrooms">Baños <span>Opcional</span></label><Choice id="bathrooms" value={f.bathrooms} onChange={v=>change('bathrooms',v==='any'?'':v)} placeholder={isLand?'No corresponde':'Sin preferencia'} disabled={isLand} items={[{id:'any',label:'Sin preferencia'},...Array.from({length:10},(_,i)=>({id:String(i+1),label:`${i+1} ${i===0?'baño':'baños'}`}))]}/></div>
          <div className="field"><label htmlFor="municipality">Municipio <span>Opcional</span></label><Choice id="municipality" value={f.municipality} onChange={v=>{const zone=SEARCH_ZONES.find(z=>z.id===f.zone);setFilters({...f,municipality:v,zone:zone&&v!=='all'&&zone.municipality!==v?'':f.zone});onClearErrors();}} items={[{id:'all',label:'Todo Santa Cruz'},...MUNICIPALITIES.map(m=>({id:m.name,label:m.name}))]}/></div>
        </div>
        {f.type==='monoambiente'&&<div className="inline-note"><Building2 size={15}/>Un monoambiente integra dormitorio y sala en un solo ambiente.</div>}
        {f.type==='proyecto'&&<div className="inline-note"><Building2 size={15}/>Incluye proyectos en preventa y en construcción.</div>}
      </section>
      <section className="form-section"><div className="section-title"><span className="step-number">02</span><div><h2>Afina tu búsqueda</h2><p>Estos detalles son opcionales.</p></div><SlidersHorizontal size={19} className="section-icon"/></div>
        <div className="fields-grid budget-grid"><div className="field"><label htmlFor="currency">Moneda</label><Choice id="currency" value={f.currency} onChange={v=>change('currency',v as Filters['currency'])} items={[{id:'USD',label:'Dólares · $us'},{id:'BOB',label:'Bolivianos · Bs'}]}/></div>
          <div className="field"><label htmlFor="min-price">Presupuesto mínimo</label><div className="input-prefix"><span>{f.currency==='USD'?'$us':'Bs'}</span><input id="min-price" type="number" min="0" step="any" value={f.minPrice} onChange={e=>change('minPrice',e.target.value)} placeholder="Sin mínimo" inputMode="decimal"/></div></div>
          <div className="field"><label htmlFor="max-price">Presupuesto máximo</label><div className="input-prefix"><span>{f.currency==='USD'?'$us':'Bs'}</span><input id="max-price" type="number" min="0" step="any" value={f.maxPrice} onChange={e=>change('maxPrice',e.target.value)} placeholder="Sin máximo" inputMode="decimal"/></div></div>
        </div>
        <div className="fields-grid three-cols"><div className="field"><label htmlFor="zone">Zona o barrio</label><Select value={f.zone||'any'} onValueChange={v=>{const zone=SEARCH_ZONES.find(z=>z.id===v);setFilters({...f,zone:v==='any'?'':v,municipality:zone?.municipality||f.municipality});onClearErrors();}}><SelectTrigger id="zone" className="form-select"><SelectValue>{SEARCH_ZONES.find(z=>z.id===f.zone)?.label||f.zone||'Sin preferencia'}</SelectValue></SelectTrigger><SelectContent position="popper"><SelectItem value="any">Sin preferencia</SelectItem>{SEARCH_ZONES.map(z=><SelectItem key={z.id} value={z.id}>{z.label}</SelectItem>)}</SelectContent></Select></div><div className="field"><label htmlFor="min-area">Superficie mínima</label><div className="input-suffix"><input id="min-area" type="number" min="0" step="any" value={f.minArea} onChange={e=>change('minArea',e.target.value)} placeholder="Sin mínimo"/><span>m²</span></div></div><div className="field"><label htmlFor="max-area">Superficie máxima</label><div className="input-suffix"><input id="max-area" type="number" min="0" step="any" value={f.maxArea} onChange={e=>change('maxArea',e.target.value)} placeholder="Sin máximo"/><span>m²</span></div></div></div>
        <div className="field amenities-field"><label>Características que necesita</label><div className="amenity-grid">{AMENITIES.map(a=><label className={`check-option ${f.amenities.includes(a.id)?'checked':''}`} key={a.id}><Checkbox checked={f.amenities.includes(a.id)} onCheckedChange={()=>toggle('amenities',a.id)}/>{a.label}</label>)}</div></div>
      </section>
      <section className="form-section"><div className="section-title"><span className="step-number">03</span><div><h2>Elige dónde buscar</h2><p>{f.sources.length===9?'Todos los orígenes están seleccionados.':'Selecciona los orígenes que deseas consultar.'}</p></div><span className="selection-caption">{f.sources.length} / 9</span></div>
        <div className="agency-options">{AGENCIES.map(a=><label className={`agency-option ${f.sources.includes(a.id)?'active':''}`} key={a.id}><Checkbox checked={f.sources.includes(a.id)} onCheckedChange={()=>toggle('sources',a.id)}/><AgencyLogo agency={a}/><span>{a.name}</span></label>)}</div>
        <div className="other-source-options">{OTHER_SOURCES.map(s=><label key={s.id} className="check-option"><Checkbox checked={f.sources.includes(s.id)} onCheckedChange={()=>toggle('sources',s.id)}/>{s.name}</label>)}</div>

      </section>
      <section className="form-section text-section"><div className="section-title"><span className="step-number sparkle-step"><Sparkles size={17}/></span><div><h2>Cuéntanos un poco más</h2><p>La IA interpreta tu texto junto con los filtros.</p></div><span className="optional-label">Opcional</span></div>
        <label className="sr-only" htmlFor="details">Detalles específicos de la búsqueda</label><textarea id="details" maxLength={2000} value={f.details} onChange={e=>change('details',e.target.value)} placeholder="Por ejemplo: para una pareja con un perro, con balcón y parqueo. En Equipetrol, hasta 800 dólares." rows={4}/><div className="textarea-bottom"><span>Si hay datos contradictorios, te ayudaremos a corregirlos.</span><span>{f.details.length}/2000</span></div>
        <div className="example-row"><span>Prueba una búsqueda:</span><button type="button" onClick={()=>{setFilters({...DEFAULT_FILTERS,type:'departamento',operation:'alquiler',bedrooms:'2',details:'En Equipetrol, con balcón, parqueo y mascotas. Hasta 800 dólares.'});onClearErrors();}}>Departamento en Equipetrol</button><button type="button" onClick={()=>{setFilters({...DEFAULT_FILTERS,type:'terreno',municipality:'Samaipata',details:'Con servicios básicos y al menos 500 m2.'});onClearErrors();}}>Terreno en Samaipata</button></div>
      </section>
      {errors.length>0&&<div className="validation-errors" ref={errorRef} role="alert"><AlertCircle size={21}/><div><strong>Revisemos estos datos antes de buscar</strong><ul>{errors.map((err,i)=><li key={i}>{err}</li>)}</ul><p>Corrige el formulario o el texto y vuelve a intentarlo.</p></div></div>}
      <div className="search-actions"><Button className="reset-button" type="button" variant="ghost" disabled={loading} onClick={()=>{setFilters({...DEFAULT_FILTERS});onClearErrors();}}><RotateCcw size={16}/>Limpiar filtros</Button><Button className="primary-button search-submit" type="submit" disabled={loading}>{loading?<span className="spinner"/>:<Search size={18}/>} {loading?'Interpretando tu búsqueda…':'Encontrar inmuebles'}</Button></div>
    </form>

    </div>
    <footer className="page-footer"><span>TuCasa · Tecnología para asesorar mejor.</span><span>Acceso privado para empresas <ShieldCheck size={13}/></span></footer>
  </main>;
}
