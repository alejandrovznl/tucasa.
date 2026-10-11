import { areasForSearch, anchorsForType, resolveZone, zoneForAnchor, type GeographicArea, type GeographicAnchor } from './geography';
import { samplePublicationContact } from './publication-contacts';
import { AGENCIES, AMENITIES, MUNICIPALITIES, OPERATIONS, OTHER_SOURCES, TYPES, typeLabel, money, type Filters, type Property, type SearchResult, type PropertyType } from './tucasa';

export const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const STOPWORDS=new Set('busco buscar quiero necesito deseo una un uno dos tres cuatro cinco seis de del la el los las con sin para por en y o que al una como dormitorios dormitorio habitaciones habitacion cuartos cuarto'.split(' '));
const tokens = (s: string) => (normalize(s).match(/[a-z]+/g) || []).filter(w=>!STOPWORDS.has(w));
// Small supervised multinomial Naive Bayes model. It classifies housing intents locally;
// quantities, negations and contradictions are deliberately checked separately.
const samples: [string, string[]][] = [
  ['casa', ['busco una casa familiar independiente', 'vivienda casa con jardin', 'casa de dos plantas en alquiler']],
  ['departamento', ['busco departamento de dos dormitorios', 'quiero un apartamento con balcon', 'dpto departamento amplio en edificio']],
  ['monoambiente', ['busco monoambiente para una persona', 'estudio compacto integrado', 'monoambiente tipo estudio amoblado']],
  ['duplex', ['busco un duplex con dos niveles', 'quiero vivienda duplex', 'departamento duplex de dos plantas']],
  ['penthouse', ['quiero un penthouse con terraza', 'busco penthouse en ultimo piso', 'penthouse amplio panoramico']],
  ['terreno', ['busco un terreno vacio', 'quiero terreno para construir', 'terreno con servicios basicos']],
  ['lote', ['busco lote en urbanizacion', 'quiero lote dentro de condominio', 'lote urbanizado residencial']],
  ['quinta', ['quiero una quinta para descanso', 'busco quinta con piscina', 'quinta familiar en el campo']],
  ['finca', ['busco finca agropecuaria', 'propiedad agropecuaria finca', 'finca para cultivo y produccion']],
  ['agricola', ['busco propiedad agricola para cultivo', 'terreno agricola de produccion', 'propiedad agricola cultivable']],
  ['ganadera', ['busco propiedad ganadera', 'terreno ganadero para ganado', 'propiedad ganadera con potreros']],
  ['bodega', ['busco bodega para almacenaje', 'deposito de mercaderia', 'bodega deposito logistica']],
  ['oficina', ['busco oficina para trabajar', 'oficina corporativa en edificio', 'oficina para consultorio']],
  ['local', ['busco local comercial para negocio', 'tienda local comercial en avenida', 'local para abrir comercio']],
  ['galpon', ['busco galpon para almacen', 'deposito galpon industrial', 'galpon para bodega y logistica']],
  ['proyecto', ['busco proyecto de construccion en preventa', 'proyecto nuevo en desarrollo', 'departamento en proyecto de construccion']],
];
const vocab = new Set(samples.flatMap(([, examples]) => examples.flatMap(tokens)));
const model = samples.map(([label, examples]) => {
  const counts = new Map<string, number>(); let total = 0;
  for (const word of examples.flatMap(tokens)) { counts.set(word, (counts.get(word) || 0) + 1); total++; }
  return {label, counts, total};
});
export function classifyIntent(text: string) {
  const words = tokens(text).filter(w => vocab.has(w));
  if (!words.length) return {label: '', confidence: 0};
  const scores = model.map(m => ({label:m.label, score: words.reduce((a,w) => a + Math.log(((m.counts.get(w)||0)+1)/(m.total+vocab.size)) * 3, 0)})).sort((a,b)=>b.score-a.score);
  const sum = scores.reduce((a,s)=>a+Math.exp(s.score-scores[0].score),0);
  return {label:scores[0].label, confidence:1/sum};
}
const numberWords: Record<string, number> = { un:1, una:1, uno:1, dos:2, tres:3, cuatro:4, cinco:5, seis:6, siete:7, ocho:8, nueve:9, diez:10, cero:0 };
const parseNumber = (v: string) => numberWords[v] ?? Number(v);
function quantity(text:string, unit:string): number|null {
  const match = text.match(new RegExp(`\\b(\\d{1,3}|cero|un[oa]?|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\\s*(?:${unit})\\b`));
  return match ? parseNumber(match[1]) : null;
}
function amount(value:string) {
  const raw=value.trim(); const separators=[...raw.matchAll(/[.,]/g)];
  if(!separators.length)return Number(raw);
  const last=separators[separators.length-1].index!;
  const tail=raw.length-last-1;
  if(tail===3 && raw.split(/[.,]/).slice(1).every(part=>part.length===3))return Number(raw.replace(/[.,]/g,''));
  const whole=raw.slice(0,last).replace(/[.,]/g,'');
  return Number(`${whole}.${raw.slice(last+1)}`);
}
function requested(text:string, pattern:string) {
  const positive = new RegExp(`\\b(?:${pattern})\\b`).test(text);
  const negative = new RegExp(`(?:sin|no(?: (?:quiero|necesito|deseo|busco))?|no tiene|no acepta)\\s+(?:\\w+\\s+){0,2}(?:${pattern})\\b`).test(text);
  return {positive:positive && !negative, negative};
}
export type Interpretation = { filters: Filters; interpreted: string[]; errors: string[]; excluded: string[] };
export function interpretFilters(input: Filters): Interpretation {
  const f: Filters = {...input, amenities:[...input.amenities], sources:[...input.sources]};
  const errors: string[]=[]; const interpreted:string[]=[]; const excluded:string[]=[];
  const text=normalize(f.details); const spec=TYPES.find(t=>t.id===f.type);
  if (!spec) errors.push('Selecciona el tipo de inmueble que deseas buscar.');
  if (!OPERATIONS[f.operation]) errors.push('Selecciona una operación válida.');
  if (spec?.residential && (!f.bedrooms || Number(f.bedrooms)<1)) errors.push(`Indica cuántos dormitorios necesitas para ${spec.label.toLowerCase()}.`);
  if (!f.sources.length) errors.push('Selecciona al menos un origen para tu búsqueda.');
  for (const [low,high,name] of [[f.minPrice,f.maxPrice,'presupuesto'],[f.minArea,f.maxArea,'superficie']]) {
    if ([low,high].some(v=>v && (!Number.isFinite(Number(v)) || Number(v)<0))) errors.push(`El ${name} debe tener valores numéricos iguales o mayores que cero.`);
    if (low && high && Number(low)>Number(high)) errors.push(`El mínimo de ${name} no puede ser mayor que el máximo.`);
  }
  if(spec?.id==='monoambiente'&&f.bedrooms&&Number(f.bedrooms)>0)errors.push('Un monoambiente no tiene dormitorios separados. Corrige la cantidad o el tipo de inmueble.');
  if(spec&&['terreno','lote','finca','agricola','ganadera'].includes(spec.id)&&f.bedrooms)errors.push('Los terrenos no requieren dormitorios. Deja ese campo vacío.');
  const beds=quantity(text,'dormitorios?|habitaciones?|cuartos?');
  const baths=quantity(text,'banos?');
  if (spec?.id==='monoambiente' && beds!==null && beds>0) errors.push(`Elegiste Monoambiente, pero escribiste ${beds} dormitorios. Un monoambiente tiene un solo ambiente integrado. Cambia el tipo de inmueble o corrige el texto.`);
  else if (spec && ['terreno','lote','finca','agricola','ganadera'].includes(spec.id) && (beds!==null || baths!==null) && !/para (?:hacer|construir)|proyect|a futuro/.test(text)) errors.push('Elegiste un terreno o propiedad de campo sin construcción, pero pediste dormitorios o baños. Cambia el tipo de inmueble o aclara que se trata de una construcción futura.');
  else if (beds!==null) {
    if(f.bedrooms && Number(f.bedrooms)!==beds) errors.push(`Seleccionaste ${f.bedrooms} dormitorios, pero escribiste ${beds}. Corrige uno de esos datos para que coincidan.`);
    else { f.bedrooms=String(beds); interpreted.push(`${beds} dormitorios`); }
  }
  if(baths!==null && !['terreno','lote','finca','agricola','ganadera'].includes(f.type)) {
    if(f.bathrooms && Number(f.bathrooms)!==baths) errors.push(`Seleccionaste ${f.bathrooms} baños, pero escribiste ${baths}. Revisa el formulario o el texto.`);
    else { f.bathrooms=String(baths); interpreted.push(`${baths} baños`); }
  }
  const operationPatterns:Record<string,string>={venta:'venta|comprar|compra',alquiler:'alquiler|alquilar|rentar|arrendar',anticretico:'anticretico|anticretica'};
  const requestedOperations=Object.entries(operationPatterns).filter(([,pattern])=>requested(text,pattern).positive).map(([id])=>id);
  if(requestedOperations.length>1) errors.push('El texto pide más de una operación. Elige venta, alquiler o anticrético para esta búsqueda.');
  else if(requestedOperations.length===1 && requestedOperations[0]!==f.operation) errors.push(`Elegiste ${OPERATIONS[f.operation]}, pero el texto pide ${OPERATIONS[requestedOperations[0] as keyof typeof OPERATIONS]}. Usa la misma operación en ambos lugares.`);
  if(requested(text,operationPatterns[f.operation]||'__none__').negative) errors.push(`El texto excluye ${OPERATIONS[f.operation]}, que está seleccionado en el formulario. Corrige la operación o el texto.`);
  const intent=classifyIntent(text);
  const explicitType = /\bmonoambiente\b/.test(text)?'monoambiente': /\b(?:proyecto|preventa)\b/.test(text)?'proyecto': intent.confidence > .68 ? intent.label : '';
  const typeMention = /\b(?:casa|departamento|apartamento|dpto|duplex|penthouse|terreno|lote|quinta|finca|oficina|local comercial|galpon|bodega|deposito|agricola|ganadera|monoambiente)\b/.test(text);
  if (explicitType && explicitType!==f.type && typeMention && !/para construir|vista a|cerca de|junto a|no quiero|no busco/.test(text)) errors.push(`El tipo seleccionado es ${typeLabel(f.type)}, pero el texto parece pedir ${typeLabel(explicitType)}. Revisa el tipo de inmueble o la descripción.`);
  const amenityPatterns:Record<string,string>={parking:'estacionamiento|parqueo|garaje|garage',pool:'piscina|alberca',pets:'mascotas?|perros?|gatos?',furnished:'amoblado|amueblado',balcony:'balcon',garden:'jardin',security:'seguridad|vigilancia',elevator:'ascensor|elevador',accessible:'accesible|sin escalones',services:'servicios basicos|agua y luz'};
  for (const [id,pattern] of Object.entries(amenityPatterns)) {
    const req=requested(text,pattern);
    if(req.negative){ excluded.push(id); if(f.amenities.includes(id)) errors.push(`Marcaste ${AMENITIES.find(a=>a.id===id)?.label}, pero el texto lo excluye. Corrige esa diferencia.`); }
    else if(req.positive && !f.amenities.includes(id)) { f.amenities.push(id); interpreted.push(AMENITIES.find(a=>a.id===id)!.label); }
  }
  const textZone=resolveZone(f.details, true);
  if(textZone) {
    const formZone=resolveZone(f.zone);
    if(f.zone && formZone?.name!==textZone.name) errors.push(`La zona del formulario y la del texto son distintas: ${f.zone} y ${textZone.name}.`);
    else {f.zone=textZone.name;interpreted.push(textZone.name);}
  }
  const formZone=resolveZone(f.zone);
  if(formZone){
    if(f.municipality!=='all'&&f.municipality!==formZone.municipality)errors.push(`${f.zone} corresponde a ${formZone.municipality}, pero seleccionaste ${f.municipality}. Revisa la ubicación.`);
    else {if(f.municipality==='all')interpreted.push(formZone.municipality);f.municipality=formZone.municipality;f.zone=formZone.name;}
  }
  const city=MUNICIPALITIES.find(m=>new RegExp(`\\b${normalize(m.name)}\\b`).test(text) || (m.name==='Santa Cruz de la Sierra'&&/\ben santa cruz(?: de la sierra)?\b/.test(text)) || (m.name==='San Ignacio de Velasco'&&/\bsan ignacio\b/.test(text)));
  if(city) {
    if(f.municipality!=='all' && f.municipality!==city.name) errors.push(`Seleccionaste ${f.municipality}, pero el texto indica ${city.name}. Elige una sola ubicación.`);
    else {f.municipality=city.name;interpreted.push(city.name);}
  }
  const monetaryCurrency=(prefix:string|undefined,suffix:string|undefined)=>{
    const token=[prefix,suffix].filter(Boolean).join(' ');
    return /bolivianos|bob|bs/.test(token)?'BOB':/dolares|usd|\$/.test(token)?'USD':f.currency;
  };
  const moneyPrefix='(\\$us|\\$|usd|bob|bs\\.?)?';
  const moneySuffix='(dolares|usd|\\$us|bolivianos|bob|bs)?';
  const maxMatch=text.match(new RegExp(`(?:hasta|maximo|no mas de|presupuesto de|menos de)\\s*${moneyPrefix}\\s*(\\d[\\d.,]*)(?:\\s*(mil))?\\s*${moneySuffix}`));
  if(maxMatch && !/^\s*(?:m2|m²|metros cuadrados|dormitorios?|banos?)\b/.test(text.slice(maxMatch.index!+maxMatch[0].length))) {
    const val=amount(maxMatch[2])*(maxMatch[3]?1000:1);const currency=monetaryCurrency(maxMatch[1],maxMatch[4]);
    if(currency!==f.currency)errors.push('La moneda del texto y la del presupuesto son diferentes. Selecciona la moneda que deseas usar.');
    else if(f.minPrice && Number(f.minPrice)>val)errors.push('El presupuesto máximo del texto es menor que el mínimo del formulario.');
    else if(Number.isFinite(val)&&val<=1e12){f.maxPrice=String(f.maxPrice!==''?Math.min(Number(f.maxPrice),val):val);interpreted.push(`Hasta ${f.currency==='USD'?'$us':'Bs'} ${val}`);}
    else errors.push('Revisa el presupuesto del texto; el valor no es válido.');
  }
  const rangeMatch=text.match(new RegExp(`entre\\s*${moneyPrefix}\\s*(\\d[\\d.,]*)(?:\\s*(mil))?\\s*(?:y|a)\\s*(\\d[\\d.,]*)(?:\\s*(mil))?\\s*${moneySuffix}`));
  if(rangeMatch && !/^\s*(?:m2|m²|metros cuadrados)\b/.test(text.slice(rangeMatch.index!+rangeMatch[0].length))) {
    const low=amount(rangeMatch[2])*(rangeMatch[3]?1000:1),high=amount(rangeMatch[4])*(rangeMatch[5]?1000:1);
    if(monetaryCurrency(rangeMatch[1],rangeMatch[6])!==f.currency)errors.push('La moneda del texto y la del presupuesto son diferentes.');
    else if(low>high)errors.push('El presupuesto mínimo del texto es mayor que el máximo.');
    else if(!Number.isFinite(low)||!Number.isFinite(high)||high>1e12)errors.push('Revisa los valores del presupuesto del texto.');
    else {f.minPrice=String(Math.max(Number(f.minPrice)||0,low));f.maxPrice=String(f.maxPrice!==''?Math.min(Number(f.maxPrice),high):high);interpreted.push(`Entre ${f.currency==='USD'?'$us':'Bs'} ${low} y ${high}`);if(Number(f.minPrice)>Number(f.maxPrice))errors.push('El rango de presupuesto del texto no coincide con el del formulario.');}
  }
  const areaMatch=text.match(/(?:al menos|minimo|desde|de)\s*(\d[\d.,]*)\s*(?:m2|m²|metros cuadrados)/);
  if(areaMatch) {const n=amount(areaMatch[1]);if(n>1e12)errors.push('Revisa la superficie del texto.');else {f.minArea=String(Math.max(Number(f.minArea)||0,n));interpreted.push(`Desde ${n} m²`);if(f.maxArea&&n>Number(f.maxArea))errors.push('La superficie del texto supera el máximo del formulario.');}}
  const maxAreaMatch=text.match(/(?:hasta|maximo|no mas de|menos de)\s*(\d[\d.,]*)\s*(?:m2|m²|metros cuadrados)/);
  if(maxAreaMatch){const n=amount(maxAreaMatch[1]);if(n>1e12)errors.push('Revisa la superficie del texto.');else {f.maxArea=String(f.maxArea!==''?Math.min(Number(f.maxArea),n):n);interpreted.push(`Hasta ${n} m²`);if(f.minArea&&Number(f.minArea)>n)errors.push('La superficie máxima del texto es menor que el mínimo del formulario.');}}
  return {filters:f,interpreted:[...new Set(interpreted)],errors:[...new Set(errors)],excluded};
}
function hash(s:string) { let h=2166136261; for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);} return h>>>0; }
function rng(seed:number) {let s=seed;return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};}
function publicationDescription(p: Property, style: number) {
  const label=typeLabel(p.type);const land=['terreno','lote','finca','agricola','ganadera'].includes(p.type);
  const features=p.amenities.map(id=>AMENITIES.find(a=>a.id===id)!.label);
  const rooms=p.bedrooms===0?'Un ambiente integrado':p.bedrooms!==null?`${p.bedrooms} dormitorios`:'';
  const bath=p.bathrooms!==null?`${p.bathrooms} ${p.bathrooms===1?'baño':'baños'}`:'';
  const size=`${p.area.toLocaleString('es-BO')} m²`;
  const price=`${money(p.price,p.currency)}${p.operation==='alquiler'?' mensuales':''}`;
  const distribution=land?'Superficie libre, sin construcción.':p.type==='proyecto'?[2,4].includes(p.photoIndex!)?'Unidad terminada, con cocina y espacios interiores listos.':'Obra en desarrollo. Las fotos interiores muestran su avance de construcción.':p.photo==='commercial'?p.type==='oficina'?'Ambiente de trabajo con iluminación natural.':p.type==='local'?'Salón comercial con acceso desde la calle.':'Nave cubierta para almacenamiento y circulación de mercadería.':p.bedrooms===0?'Cocina y zona de descanso dentro del mismo ambiente.':'Sala, comedor y cocina con iluminación natural.';
  switch(style%6){
    case 0:return `${label} en ${p.zone}. ${size}. ${[rooms,bath].filter(Boolean).join(', ')}.${features.length?` ${features.slice(0,2).join(' y ')}.`:''} ${price}.`;
    case 1:return `${OPERATIONS[p.operation].toUpperCase()} · ${label.toUpperCase()}\n📍 ${p.zone}, ${p.municipality}\n\n📐 Superficie: ${size}${rooms?`\n🛏️ ${rooms}`:''}${bath?`\n🚿 ${bath}`:''}\n\n${distribution}${features.length?`\n\n✨ CARACTERÍSTICAS\n${features.map(v=>'✅ '+v).join('\n')}`:''}\n\n💰 ${price}`;
    case 2:return `${label} disponible en ${p.zone}, ${p.municipality}.\n\n${distribution} La superficie es de ${size}${rooms?` y cuenta con ${rooms.toLowerCase()}`:''}${bath?`, además de ${bath}`:''}. ${features.length?`Cuenta con ${features.map(v=>v.toLowerCase()).join(', ')}.`:''}\n\nValor de ${OPERATIONS[p.operation].toLowerCase()}: ${price}. Coordina una visita para conocer los espacios y revisar los detalles de la operación.`;
    case 3:return `${label} / ${p.zone}\n${size}${rooms?' · '+rooms:''}${bath?' · '+bath:''}\n${price}`;
    case 4:return `🏡 ${label.toUpperCase()} EN ${OPERATIONS[p.operation].toUpperCase()}\n\n📍 UBICACIÓN\n${p.zone} · ${p.municipality}\n\n📋 DETALLES DEL INMUEBLE\n• ${size} de superficie${rooms?'\n• '+rooms:''}${bath?'\n• '+bath:''}\n• ${distribution}${features.length?'\n\n'+(p.amenities.includes('pool')?'🏊 COMODIDADES Y ÁREAS SOCIALES':'✨ COMODIDADES')+'\n'+features.map(v=>'• '+v).join('\n'):''}\n\n${land?'El terreno se muestra desde su frente, el acceso y una vista general para apreciar el entorno.':'La galería incluye el exterior y distintas vistas interiores del inmueble.'}\n\n💵 ${price}\nEscríbenos para coordinar una visita y consultar las condiciones.`;
    default:return `${OPERATIONS[p.operation]} de ${label.toLowerCase()} en ${p.zone}.\n\n${size}${rooms?' | '+rooms:''}${bath?' | '+bath:''}. ${distribution}${features.length?'\n'+features.join(' · '):''}\n\nPrecio: ${price}. Visitas a coordinar.`;
  }
}
export function generateResults(f:Filters, interpreted:string[], excluded:string[]=[], at?:string):SearchResult {
  const createdAt=at||new Date().toISOString();const searchId=crypto.randomUUID();
  const seed=hash(JSON.stringify(f)+(at||searchId));const random=rng(seed);
  const shuffle=<T,>(items:T[])=>{const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  const agencies=AGENCIES.filter(a=>f.sources.includes(a.id));
  const others=OTHER_SOURCES.filter(a=>f.sources.includes(a.id));
  const areas=areasForSearch(f);
  const eligible=areas.flatMap(area=>anchorsForType(area,f.type as PropertyType).map(anchor=>({area,anchor})));
  const spaced: {area:GeographicArea;anchor:GeographicAnchor}[]=[];
  const target=7+Math.floor(random()*8);
  for(const candidate of shuffle(eligible)){
    if(spaced.some(p=>Math.hypot((p.anchor[0]-candidate.anchor[0])*.95,p.anchor[1]-candidate.anchor[1])<.0016))continue;
    spaced.push(candidate);if(spaced.length===target)break;
  }
  // User-requested ordering: Century 21, then RE/MAX, with a moderate lead.
  const priority=[...agencies.filter(a=>['century','remax'].includes(a.id)),...shuffle(agencies.filter(a=>!['century','remax'].includes(a.id)))];
  const agencyCount=Math.min(priority.length,spaced.length,priority.length>1?2+Math.floor(random()*5):1);
  const chosenAgencies=priority.slice(0,agencyCount);
  const locations=chosenAgencies.length?spaced:[];
  const weights=chosenAgencies.map(a=>a.id==='century'?1.65:a.id==='remax'?1.4:1);
  const counts=chosenAgencies.map(()=>1);
  for(let slot=chosenAgencies.length;slot<locations.length;slot++){
    const minimum=Math.min(...counts);
    const eligible=counts.map((count,index)=>({index,score:(count+1)/weights[index]})).filter(c=>counts[c.index]+1<=minimum+2).sort((a,b)=>a.score-b.score||a.index-b.index);
    counts[eligible[0].index]++;
  }
  const allocation=shuffle(chosenAgencies.flatMap((agency,index)=>Array.from({length:counts[index]},()=>agency.id)));
  const otherCount=4+Math.floor(random()*5);
  const sources=[...locations.map((location,i)=>({id:allocation[i],location})),...Array.from({length:others.length?otherCount:0},(_,i)=>({id:others[i%others.length].id,location:null}))];
  const spec=TYPES.find(t=>t.id===f.type)!;const isLand=['terreno','lote','finca','agricola','ganadera'].includes(f.type);
  const defaultSale:Record<string,number>={departamento:85000,casa:135000,monoambiente:39000,duplex:105000,penthouse:190000,terreno:45000,lote:26000,quinta:165000,finca:230000,agricola:160000,ganadera:250000,bodega:90000,oficina:65000,local:70000,galpon:125000,proyecto:62000};
  let usual=defaultSale[f.type];if(f.operation==='alquiler')usual=Math.round(usual*.006);if(f.operation==='anticretico')usual=Math.round(usual*.23);if(f.currency==='BOB')usual*=6.96;
  const low=f.minPrice?Number(f.minPrice):f.maxPrice?Number(f.maxPrice)*.68:usual*.7;
  const high=Math.min(1e12,f.maxPrice?Number(f.maxPrice):Math.max(low*1.8,usual*1.25));
  const areaDefaults:Record<string,number>={departamento:95,casa:230,monoambiente:38,duplex:140,penthouse:220,terreno:450,lote:360,quinta:1500,finca:10000,agricola:15000,ganadera:20000,bodega:450,oficina:75,local:95,galpon:600,proyecto:85};
  const minArea=f.minArea?Number(f.minArea):f.maxArea?Number(f.maxArea)*.65:areaDefaults[f.type]*.7;
  const maxArea=Math.min(1e12,f.maxArea?Number(f.maxArea):Math.max(minArea*1.8,areaDefaults[f.type]*1.4));
  const photoOffset=Math.floor(random()*6),styleOffset=Math.floor(random()*6);
  const contactCounts: Record<string, number> = {};
  const properties:Property[]=sources.map((source,i)=>{
    const cityName=source.location?.area.municipality||(f.municipality!=='all'?f.municipality:areas[Math.floor(random()*Math.max(1,areas.length))]?.municipality||'Santa Cruz de la Sierra');
    const zone=f.zone||(source.location?zoneForAnchor(source.location.area,source.location.anchor):isLand?'Entorno del municipio':'Área urbana');
    const bedrooms=isLand||['oficina','local','galpon','bodega'].includes(f.type)?null:f.type==='monoambiente'?0:f.bedrooms!==''?Number(f.bedrooms):2+(i%2);
    const bathrooms=isLand?null:f.bathrooms!==''?Number(f.bathrooms):Math.max(1,Math.min(3,bedrooms||1));
    const step=f.operation==='alquiler'?(f.currency==='USD'?10:25):(f.currency==='USD'?500:1000);
    const price=Math.max(low,Math.min(high,Math.round((low+random()*(high-low))/step)*step));
    const area=Math.max(minArea,Math.min(maxArea,Math.round(minArea+random()*(maxArea-minArea))));
    const allowedExtras=isLand?['services']:spec.photo==='house'?['security','parking','garden']:spec.photo==='commercial'?['security','parking']:['security','parking','balcony','elevator'];
    const extras=AMENITIES.filter(a=>allowedExtras.includes(a.id)&&!excluded.includes(a.id)&&!f.amenities.includes(a.id)&&random()>.55).map(a=>a.id);
    const amenities=[...new Set([...f.amenities,...extras])];
    let photoIndex=(i+photoOffset)%6;
    if(f.type==='oficina')photoIndex=[1,4][i%2];else if(f.type==='local')photoIndex=[0,3][i%2];else if(['galpon','bodega'].includes(f.type))photoIndex=[2,5][i%2];
    if(f.type==='proyecto'&&source.location?.anchor[2]==='project')photoIndex=[0,1,3,5][i%4];
    const roomLabel=bedrooms===0?'ambiente integrado':bedrooms!==null?`${bedrooms} dormitorios`:'';
    const titles=isLand?[`${spec.label} en ${zone}`,`${spec.label} con frente abierto`,`${spec.label} con acceso directo`]:f.type==='proyecto'?[`Proyecto residencial en ${zone}`,`Proyecto ${['Terra','Jardines','Alameda'][i%3]}`,`${[2,4].includes(photoIndex)?'Unidad terminada':'Proyecto en construcción'}`]:[`${spec.label} ${roomLabel?`de ${roomLabel}`:`en ${zone}`}`,`${spec.label} en ${zone}`,`${spec.label} con iluminación natural`];
    const property:Property={id:`TC-${seed.toString(36)}-${i+1}`,title:titles[i%titles.length],type:f.type as PropertyType,operation:f.operation,price,currency:f.currency,municipality:cityName,zone,area,bedrooms,bathrooms,amenities,source:source.id,confirmed:Boolean(source.location),coordinates:source.location?[source.location.anchor[0],source.location.anchor[1]]:null,photo:spec.photo,photoIndex,description:'',extras:f.details.trim(),reference:`TC-${String(seed%10000).padStart(4,'0')}-${String(i+1).padStart(2,'0')}`};
    if(!source.location) {
      const sequence=(contactCounts[source.id]||0)+photoOffset;
      contactCounts[source.id]=(contactCounts[source.id]||0)+1;
      property.publicationContact=samplePublicationContact(source.id,sequence);
    }
    property.description=publicationDescription(property,i+styleOffset);
    if(property.publicationContact?.phone)property.description+=`\n\n${source.id==='deber'?'Ref.':source.id==='marketplace'?'Consultas:':'Información:'} ${property.publicationContact.name&&source.id==='deber'?property.publicationContact.name+' · ':''}${property.publicationContact.phone}`;
    return property;
  });
  return {id:`search-${searchId}`,filters:f,interpreted,properties,createdAt};
}
