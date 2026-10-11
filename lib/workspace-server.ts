import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { type Filters, type HistoryEntry, type Profile, type Property, type Workspace } from './tucasa';
export async function currentUser() {
  const user=await getChatGPTUser();
  if(user)return {id:user.userId,name:user.fullName||'Asesor'};
  if(process.env.NODE_ENV==='development')return {id:'local-preview',name:'Asesor'};
  return null;
}
function database(){if(!env.DB)throw new Error('No se pudo conectar el espacio de trabajo. Intenta nuevamente.');return env.DB;}
export async function getWorkspace(uid:string):Promise<Workspace> {
  const db=database();
  const [profile, favorites, history]=await Promise.all([
    db.prepare('SELECT data FROM profiles WHERE user_id = ?').bind(uid).first<{data:string}>(),
    db.prepare('SELECT data FROM favorites WHERE user_id = ? ORDER BY created_at DESC LIMIT 100').bind(uid).all<{data:string}>(),
    db.prepare('SELECT id, data, count, created_at FROM searches WHERE user_id = ? ORDER BY created_at DESC LIMIT 25').bind(uid).all<{id:string,data:string,count:number,created_at:string}>(),
  ]);
  return {profile:profile?JSON.parse(profile.data):{company:'Mi inmobiliaria',advisor:'',plan:'prueba'}, favorites:favorites.results.map(r=>JSON.parse(r.data)),history:history.results.map(r=>({id:r.id,filters:JSON.parse(r.data),count:r.count,createdAt:r.created_at}))};
}
export async function saveSearch(uid:string,id:string,filters:Filters,count:number) {
  const db=database();await db.batch([db.prepare('INSERT INTO searches (id, user_id, data, count, created_at) VALUES (?, ?, ?, ?, ?)').bind(id,uid,JSON.stringify(filters),count,new Date().toISOString()),
    db.prepare('DELETE FROM searches WHERE user_id = ? AND id NOT IN (SELECT id FROM searches WHERE user_id = ? ORDER BY created_at DESC LIMIT 25)').bind(uid,uid)]);
}
export async function favorite(uid:string,property:Property,active:boolean) {
  const db=database();
  if(!active) await db.prepare('DELETE FROM favorites WHERE user_id = ? AND property_id = ?').bind(uid,property.id).run();
  else {const count=await db.prepare('SELECT COUNT(*) AS n FROM favorites WHERE user_id = ?').bind(uid).first<{n:number}>();if((count?.n||0)>=100)throw new Error('Puedes guardar hasta 100 inmuebles. Quita uno antes de agregar otro.');await db.prepare('INSERT OR REPLACE INTO favorites (id,user_id,property_id,data,created_at) VALUES (?,?,?,?,?)').bind(`${uid}:${property.id}`,uid,property.id,JSON.stringify(property),new Date().toISOString()).run();}
}
export async function saveProfile(uid:string,p:Profile) {await database().prepare('INSERT OR REPLACE INTO profiles (user_id,data) VALUES (?,?)').bind(uid,JSON.stringify(p)).run();}
export async function clearHistory(uid:string) {await database().prepare('DELETE FROM searches WHERE user_id = ?').bind(uid).run();}
export async function saveSupport(uid:string,message:string) {const id=crypto.randomUUID();await database().prepare('INSERT INTO support (id,user_id,message,created_at) VALUES (?,?,?,?)').bind(id,uid,message,new Date().toISOString()).run();return id;}
