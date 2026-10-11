import ts from 'typescript';
import assert from 'node:assert/strict';
import { readFileSync,writeFileSync,mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const dir=mkdtempSync(join(tmpdir(),'tucasa-check-'));
for(const name of ['tucasa','geography','publication-contacts','search-engine']){
 let input=readFileSync(new URL(`../../lib/${name}.ts`,import.meta.url),'utf8').replace("from './tucasa'","from './tucasa.mjs'").replace("from './geography'","from './geography.mjs'").replace("from './publication-contacts'","from './publication-contacts.mjs'");
 if(name==='geography')input=input.replace("import snapshot from './geographic-anchors.json';",'const snapshot='+readFileSync(new URL('../../lib/geographic-anchors.json',import.meta.url),'utf8')+';');
 writeFileSync(join(dir,`${name}.mjs`),ts.transpileModule(input,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText);
}
const {DEFAULT_FILTERS,TYPES,MUNICIPALITIES,SEARCH_ZONES,OTHER_SOURCES,AGENCIES}=await import(pathToFileURL(join(dir,'tucasa.mjs')));
const {areasForSearch,anchorsForType,resolveZone}=await import(pathToFileURL(join(dir,'geography.mjs')));
const {interpretFilters,generateResults}=await import(pathToFileURL(join(dir,'search-engine.mjs')));
let passed=0,queries=0;const check=(condition,message)=>{assert.ok(condition,message);passed++;};
for(const spec of TYPES)for(const operation of ['venta','alquiler','anticretico'])for(const currency of ['USD','BOB']){
 const f={...DEFAULT_FILTERS,type:spec.id,operation,currency,bedrooms:spec.residential?'3':spec.id==='monoambiente'?'0':'',bathrooms:spec.residential?'2':'',minPrice:'250',maxPrice:'900',minArea:'20',maxArea:'600',amenities:['parking','services']};
 const i=interpretFilters(f);check(i.errors.length===0,`Valid query ${spec.id} rejected: ${i.errors}`);const r=generateResults(i.filters,i.interpreted,i.excluded);queries++;
 check(r.properties.length>=4&&r.properties.length<=22,'Missing adaptive results');check(r.properties.every(p=>p.type===spec.id&&p.operation===operation&&p.currency===currency&&p.price>=250&&p.price<=900&&p.area>=20&&p.area<=600),'Range/filter mismatch');
 check(r.properties.every(p=>p.amenities.includes('parking')&&p.amenities.includes('services')),'Missing requested amenities');check(r.properties.every(p=>p.confirmed===Boolean(p.coordinates)),'Unconfirmed listing placed on map');if(spec.residential)check(r.properties.every(p=>p.bedrooms===3&&p.bathrooms===2),'Bedroom/bath mismatch');
}
const cases=[
 [{type:'monoambiente',bedrooms:'0',details:'de 2 dormitorios'},true],
 [{type:'casa',bedrooms:'3',details:'de dos dormitorios'},true],
 [{type:'departamento',bedrooms:'2',operation:'venta',details:'busco en alquiler'},true],
 [{type:'terreno',details:'con dos dormitorios'},true],
 [{type:'terreno',details:'para construir una casa'},false],
 [{type:'departamento',bedrooms:'2',details:'quiero una casa'},true],
 [{type:'casa',bedrooms:'3',amenities:['pool'],details:'sin piscina'},true],
 [{type:'casa',bedrooms:'2',details:'sin piscina'},false],
 [{type:'casa',bedrooms:'2',municipality:'Warnes',details:'en Equipetrol'},true],
 [{type:'casa',bedrooms:'2',minPrice:'900',maxPrice:'100'},true],
 [{type:'monoambiente',bedrooms:'2'},true],
 [{type:'terreno',bedrooms:'2'},true],
];
for(const [change,error]of cases){const q=interpretFilters({...DEFAULT_FILTERS,...change});check(Boolean(q.errors.length)===error,`Contradiction case ${JSON.stringify(change)}: ${q.errors}`);if(change.details==='sin piscina'&&!error)check(generateResults(q.filters,q.interpreted,q.excluded).properties.every(p=>!p.amenities.includes('pool')),'Negative feature ignored');}
const eq=interpretFilters({...DEFAULT_FILTERS,type:'departamento',operation:'alquiler',bedrooms:'2',details:'En Equipetrol, con balcón, parqueo y un perro. Hasta 800 dólares.'});check(!eq.errors.length&&eq.filters.maxPrice==='800'&&eq.filters.municipality==='Santa Cruz de la Sierra'&&eq.filters.amenities.includes('pets'),'Free text extraction failed');
const single=interpretFilters({...DEFAULT_FILTERS,type:'terreno',sources:['marketplace']});const r=generateResults(single.filters,[],[]);check(r.properties.length>=4&&r.properties.length<=8&&r.properties.every(p=>p.source==='marketplace'&&!p.confirmed),'Source selection failed');
const official=generateResults({...DEFAULT_FILTERS,type:'terreno',sources:['century']},[]);check(official.properties.length>0&&official.properties.every(p=>p.source==='century'&&p.confirmed&&p.coordinates),'Official sources must stay on the map');
for(const city of MUNICIPALITIES){const q=generateResults({...DEFAULT_FILTERS,type:'terreno',municipality:city.name},[]);check(q.properties.every(p=>p.municipality===city.name),'Municipality filter ignored');const valid=new Set(areasForSearch(q.filters).flatMap(a=>anchorsForType(a,'terreno')).map(a=>a.slice(0,2).join(',')));check(q.properties.every(p=>!p.coordinates||valid.has(p.coordinates.join(','))),'Pin is not a mapped open-land anchor');}
const narrow=generateResults({...DEFAULT_FILTERS,type:'terreno',minPrice:'100.555',maxPrice:'100.555',minArea:'20.15',maxArea:'20.15'},[]);check(narrow.properties.every(p=>p.price===100.555&&p.area===20.15),'Narrow numeric ranges changed by rounding');
const textBudgets=[
 ['Hasta Bs 5.000','BOB','5000'], ['Hasta $us 800.50','USD','800.5'],
 ['Hasta 800,50 dólares','USD','800.5'], ['Hasta 1.200,50 USD','USD','1200.5'],
 ['Hasta 1,200.50 USD','USD','1200.5'], ['Hasta 120 mil dólares','USD','120000'],
];
for(const [details,currency,maximum]of textBudgets){const q=interpretFilters({...DEFAULT_FILTERS,type:'terreno',currency,details});check(!q.errors.length&&q.filters.maxPrice===maximum,`Money text incorrectly interpreted: ${details} ${JSON.stringify(q)}`);}
const wrongCurrency=interpretFilters({...DEFAULT_FILTERS,type:'terreno',currency:'USD',details:'Hasta Bs 5000'});check(wrongCurrency.errors.length>0,'Prefix currency contradiction ignored');
const area=interpretFilters({...DEFAULT_FILTERS,type:'terreno',details:'Al menos 300 m2, hasta 700 m2.'});check(!area.errors.length&&area.filters.minArea==='300'&&area.filters.maxArea==='700'&&area.filters.maxPrice==='',`Surface limit incorrectly treated as price ${JSON.stringify(area)}`);
const budget=interpretFilters({...DEFAULT_FILTERS,type:'departamento',bedrooms:'2',details:'Entre 500 y 800 dólares'});check(!budget.errors.length&&budget.filters.minPrice==='500'&&budget.filters.maxPrice==='800','Budget range ignored');
const zone=interpretFilters({...DEFAULT_FILTERS,type:'departamento',bedrooms:'2',zone:'Equipetrol'});check(!zone.errors.length&&zone.filters.municipality==='Santa Cruz de la Sierra','Form zone must restrict municipality');
const zoneError=interpretFilters({...DEFAULT_FILTERS,type:'terreno',zone:'Urubó',municipality:'Warnes'});check(zoneError.errors.length>0,'Inconsistent municipality and zone accepted');
const shop=interpretFilters({...DEFAULT_FILTERS,type:'local',details:'Cerca de un centro comercial'});check(!shop.errors.length&&shop.filters.zone==='','A shopping center was incorrectly treated as Centro neighborhood');
const noSale=interpretFilters({...DEFAULT_FILTERS,type:'terreno',operation:'venta',details:'Quiero alquiler, no quiero venta'});check(noSale.errors.length>0,'Operation negation concealed a contradiction');
const noRental=interpretFilters({...DEFAULT_FILTERS,type:'terreno',operation:'venta',details:'No quiero alquiler, quiero comprar'});check(!noRental.errors.length,'Negated rental incorrectly rejected a purchase');
const ids=Array.from({length:30},()=>generateResults({...DEFAULT_FILTERS,type:'terreno'},[]).id);check(new Set(ids).size===ids.length,'Concurrent searches require unique IDs');


const eqResults=generateResults(eq.filters,eq.interpreted,eq.excluded,'2026-10-08T01:00:00Z');
const bounds=resolveZone('Equipetrol').bounds;
check(eqResults.properties.some(p=>p.confirmed),'Equipetrol needs mapped apartment results');
check(eqResults.properties.every(p=>!p.coordinates||(p.coordinates[0]>bounds[0]&&p.coordinates[0]<bounds[2]&&p.coordinates[1]>bounds[1]&&p.coordinates[1]<bounds[3])),'Equipetrol pins outside requested zone');
for(const name of ['Equipetrol Norte','Las Palmas','Urubó','Hamacas','Zona Norte']){
 const query=interpretFilters({...DEFAULT_FILTERS,type:'casa',bedrooms:'3',zone:name});check(!query.errors.length,`Recognized zone rejected ${name}`);
 const result=generateResults(query.filters,query.interpreted);const area=resolveZone(name);const valid=new Set(anchorsForType(area,'casa').map(a=>a.slice(0,2).join(',')));
 check(result.properties.some(p=>p.confirmed)&&result.properties.every(p=>!p.coordinates||valid.has(p.coordinates.join(','))),`Wrong location ${name}`);
}
const unmapped=generateResults({...DEFAULT_FILTERS,type:'departamento',bedrooms:'2',zone:'Zona sin referencia cartográfica'},[]);check(unmapped.properties.length>0&&unmapped.properties.every(p=>!p.coordinates&&!p.confirmed),'Unrecognized zone must not silently put pins downtown');
const counts=new Set(),distributions=new Set();let unequal=false;
for(let i=0;i<25;i++){
 const result=generateResults(eq.filters,[],[],`2026-10-08T01:${String(i).padStart(2,'0')}:00Z`);const mapped=result.properties.filter(p=>p.confirmed);counts.add(mapped.length);
 const distribution=Object.fromEntries([...new Set(mapped.map(p=>p.source))].map(id=>[id,mapped.filter(p=>p.source===id).length]));distributions.add(JSON.stringify(distribution));if(new Set(Object.values(distribution)).size>1)unequal=true;
 check(result.properties.every(p=>eq.filters.sources.includes(p.source)),'Unselected source appeared');
 check(result.properties.every(p=>p.confirmed?AGENCIES.some(a=>a.id===p.source):OTHER_SOURCES.some(a=>a.id===p.source)),'Agency appeared among external listings');
 const c=distribution.century||0,rem=distribution.remax||0,rest=Object.entries(distribution).filter(([id])=>!['century','remax'].includes(id)).map(([,count])=>count);
 check(c>=rem&&rest.every(n=>rem>=n)&&Math.max(...Object.values(distribution))-Math.min(...Object.values(distribution))<=2,'Agency priority or moderate distribution failed');
 const descriptions=result.properties.map(p=>p.description);check(descriptions.some(d=>/[📍🏡]/u.test(d))&&descriptions.some(d=>d.length<140)&&descriptions.some(d=>d.length>400),'Publication styles must vary');
 check(result.properties.every(p=>p.photoIndex>=0&&p.photoIndex<=5&&p.description.includes(p.area.toLocaleString('es-BO'))),'Photo index or description facts invalid');
}
check(counts.size>=3&&distributions.size>=4&&unequal,'Result counts and agency distributions did not vary');
console.log(JSON.stringify({status:'passed',checks:passed,queryCombinations:queries,municipalities:MUNICIPALITIES.length,mapResultCounts:[...counts].sort((a,b)=>a-b),distributions:distributions.size}));

check(SEARCH_ZONES.length===20&&new Set(SEARCH_ZONES.map(z=>z.id)).size===20,'Need exactly twenty distinct selectable zones');
for(const zone of SEARCH_ZONES){
 const query=interpretFilters({...DEFAULT_FILTERS,type:'casa',bedrooms:'3',zone:zone.id});check(!query.errors.length&&query.filters.municipality===zone.municipality,`Zone municipality mismatch ${zone.label}`);
 const areas=areasForSearch(query.filters);check(areas.length===1&&areas[0].name===zone.id,`Unmapped dropdown zone ${zone.label}`);
 const result=generateResults(query.filters,[]);const valid=new Set(anchorsForType(areas[0],'casa').map(a=>a.slice(0,2).join(',')));check(result.properties.every(p=>!p.coordinates||valid.has(p.coordinates.join(','))),`Dropdown-zone pin outside ${zone.label}`);
}
const officialOnly=generateResults({...eq.filters,sources:['century','remax']},[]);check(officialOnly.properties.length>0&&officialOnly.properties.every(p=>p.confirmed&&['century','remax'].includes(p.source)),'Official-only query created external listings');
for(const source of OTHER_SOURCES){const result=generateResults({...eq.filters,sources:[source.id]},[]);check(result.properties.length>=4&&result.properties.every(p=>p.source===source.id&&!p.confirmed&&!p.coordinates),'Single external source mixed with agency results');}
console.log(JSON.stringify({status:'passed',checks:passed,selectedZones:SEARCH_ZONES.length,sourceSeparation:true}));
