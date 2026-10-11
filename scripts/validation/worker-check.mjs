import { createRequire } from 'node:module';
import { realpathSync,readFileSync,readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
const require=createRequire(realpathSync('node_modules/wrangler/package.json'));
const {Miniflare,createFetchMock}=require('miniflare');
const fetchMock=createFetchMock();fetchMock.disableNetConnect();
fetchMock.get('https://tile.openstreetmap.org').intercept({path:'/5/10/17.png',method:'GET'}).reply(200,Buffer.from([137,80,78,71,13,10,26,10]),{headers:{'Content-Type':'image/png','Cache-Control':'public, max-age=604800'}});
function modulesIn(directory){return readdirSync(directory,{withFileTypes:true}).flatMap(entry=>{const path=resolve(directory,entry.name);return entry.isDirectory()?modulesIn(path):entry.name.endsWith('.js')?[{type:'ESModule',path}]:[];});}
const main=resolve('dist/server/index.js');
const mf=new Miniflare({
 modules:[{type:'ESModule',path:main},...modulesIn(resolve('dist/server')).filter(m=>m.path!==main)],modulesRoot:resolve('dist/server'),
 compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],
 d1Databases:['DB'],fetchMock,
});
const ownerHeaders={'oai-authenticated-user-id':'qa-owner','oai-authenticated-user-email':'qa-owner@example.invalid'};
const otherHeaders={'oai-authenticated-user-id':'qa-other','oai-authenticated-user-email':'qa-other@example.invalid'};
const filters={type:'departamento',operation:'alquiler',bedrooms:'2',bathrooms:'',municipality:'all',zone:'Equipetrol',currency:'USD',minPrice:'',maxPrice:'800',minArea:'',maxArea:'',amenities:['parking'],sources:['century','remax','kw','balcon','bien','vintage','marketplace','deber','links'],details:'Con balcón y mascotas.'};
let checks=0;
async function call(path,headers={},body){const res=await mf.dispatchFetch(`https://tucasa.test${path}`,{method:body?'POST':'GET',headers:{...headers,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});const text=await res.text();return {status:res.status,text,json:res.headers.get('content-type')?.includes('application/json')?JSON.parse(text):null};}
try{
 const db=await mf.getD1Database('DB');
 for(const name of readdirSync('drizzle').filter(n=>n.endsWith('.sql')).sort())for(const sql of readFileSync(`drizzle/${name}`,'utf8').split('--> statement-breakpoint').filter(s=>s.trim()))await db.prepare(sql.trim()).run();
 let res=await call('/');assert.equal(res.status,200,`Public entry should render: ${res.text.slice(0,160)}`);assert.ok(res.text.includes('Iniciar sesión')&&res.text.includes('beta-username')&&res.text.includes('beta-password')&&res.text.includes('type="password"'));assert.ok(!res.text.includes('beta-affiliation')&&!res.text.includes('dos dispositivos')&&!res.text.includes('signin-with-chatgpt')&&!res.text.includes('class="search-sidebar"'));checks++;
 assert.ok(res.text.includes('src="/brand.png"'));checks++;
 const tile=await mf.dispatchFetch('https://tucasa.test/api/map/5/10/17');assert.equal(tile.status,200);assert.ok(tile.headers.get('content-type').includes('image/png'));assert.equal(tile.headers.get('cache-control'),'public, max-age=604800');assert.deepEqual(new Uint8Array(await tile.arrayBuffer()),new Uint8Array([137,80,78,71,13,10,26,10]));checks++;
 res=await call('/api/map/25/10/17');assert.equal(res.status,400);res=await call('/api/map/5/999/17');assert.equal(res.status,400);checks++;
 res=await call('/api/workspace');assert.equal(res.status,401);checks++;
 res=await call('/api/workspace',{}, {action:'profile',company:'Public visitor',advisor:'qa-owner',user_id:'qa-owner'});assert.equal(res.status,401,'Public input must not impersonate a platform workspace');checks++;
 res=await call('/api/search',{'x-tucasa-beta':'1'},filters);assert.equal(res.status,200,'Anonymous beta search must work without ChatGPT');assert.ok(res.json.properties.some(p=>p.confirmed));assert.ok(res.json.properties.filter(p=>p.source==='deber').every(p=>p.publicationContact?.phone&&p.description.includes(p.publicationContact.phone)));assert.ok(res.json.properties.filter(p=>p.confirmed).every(p=>!p.publicationContact));assert.ok(res.json.properties.filter(p=>p.source==='marketplace').every(p=>p.publicationContact?.name&&p.publicationContact.messengerDemo&&!p.publicationContact.messengerUrl));checks++;
 res=await call('/api/search',{...ownerHeaders,'x-tucasa-beta':'1'},filters);assert.equal(res.status,200);res=await call('/api/workspace',ownerHeaders);assert.equal(res.json.history.length,0,'Beta visits must not write into an existing private workspace');checks++;
 res=await call('/api/workspace',{'oai-authenticated-user-email':'legacy@example.invalid'});assert.equal(res.status,200,'Authenticated email-only compatibility failed');checks++;
 res=await call('/api/workspace',ownerHeaders);assert.equal(res.status,200);assert.equal(res.json.favorites.length,0);checks++;
 res=await call('/api/search',ownerHeaders,{...filters,type:''});assert.equal(res.status,422);assert.ok(res.json.errors.some(e=>e.includes('Selecciona el tipo')));checks++;
 res=await call('/api/search',ownerHeaders,{...filters,type:'monoambiente',bedrooms:'0',details:'Quiero 2 dormitorios.'});assert.equal(res.status,422);assert.ok(res.json.errors.some(e=>e.includes('Monoambiente')));checks++;
 res=await call('/api/search',ownerHeaders,filters);assert.equal(res.status,200,JSON.stringify(res.json));assert.ok(res.json.properties.length>=11&&res.json.properties.length<=22);assert.ok(res.json.properties.every(p=>p.price<=800&&p.municipality==='Santa Cruz de la Sierra'));const property=res.json.properties[0];checks++;
 const others=res.json.properties.filter(p=>!p.confirmed);assert.ok(others.every(p=>['marketplace','deber','links'].includes(p.source)),'Only external sources belong in Otros Inmuebles');assert.equal(new Set(others.map(p=>p.photoIndex)).size,Math.min(others.length,6),'Other listings must have different photo frames');
 assert.ok(res.json.properties.filter(p=>p.confirmed).every(p=>p.coordinates[0]>-63.204&&p.coordinates[0]<-63.191&&p.coordinates[1]>-17.775&&p.coordinates[1]<-17.756),'Equipetrol coordinates must stay in the requested neighborhood');
 res=await call('/api/workspace',ownerHeaders,{action:'favorite',property,active:true});assert.equal(res.status,200);assert.equal(res.json.favorites.length,1);checks++;
 res=await call('/api/workspace',ownerHeaders,{action:'profile',company:'Empresa de prueba',advisor:'Asesor de prueba'});assert.equal(res.status,200);assert.equal(res.json.profile.company,'Empresa de prueba');checks++;
 res=await call('/api/workspace',ownerHeaders);assert.equal(res.json.favorites[0].id,property.id);assert.equal(res.json.favorites[0].photoIndex,property.photoIndex);assert.equal(res.json.history.length,1);checks++;
 res=await call('/api/workspace',otherHeaders);assert.equal(res.json.favorites.length,0);assert.equal(res.json.history.length,0);assert.equal(res.json.profile.company,'Mi inmobiliaria');checks++;
 res=await call('/api/workspace',ownerHeaders,{action:'checkout',plan:'equipo',method:'qr'});assert.equal(res.status,200);assert.equal(res.json.profile.plan,'equipo');checks++;
 res=await call('/api/workspace',ownerHeaders,{action:'favorite',property,active:false});assert.equal(res.json.favorites.length,0);checks++;
 console.log(`PASS: ${checks} compiled Worker journeys — public entry, anonymous search, external contacts, map tiles, private workspace protection, favorites, history, company, simulated plan, owner isolation.`);
}finally{await mf.dispose();}
