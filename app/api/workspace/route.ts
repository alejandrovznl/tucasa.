import { z } from 'zod';
import { currentUser, getWorkspace, favorite, saveProfile, clearHistory, saveSupport } from '@/lib/workspace-server';
import { PLANS, TYPES, ALL_SOURCES, AMENITIES, type Property } from '@/lib/tucasa';
const propertySchema=z.object({id:z.string().max(100),title:z.string().max(200),type:z.string().refine(v=>TYPES.some(t=>t.id===v)),operation:z.enum(['venta','alquiler','anticretico']),price:z.number().min(0).max(1e12),currency:z.enum(['USD','BOB']),municipality:z.string().max(100),zone:z.string().max(100),area:z.number().min(0).max(1e12),bedrooms:z.number().min(0).max(100).nullable(),bathrooms:z.number().min(0).max(100).nullable(),amenities:z.array(z.string().refine(v=>AMENITIES.some(a=>a.id===v))).max(10),source:z.string().refine(v=>ALL_SOURCES.some(s=>s.id===v)),confirmed:z.boolean(),coordinates:z.tuple([z.number().min(-180).max(180),z.number().min(-90).max(90)]).nullable(),photo:z.enum(['apartment','house','studio','land','commercial','project']),photoIndex:z.number().int().min(0).max(5).optional(),description:z.string().max(2000),extras:z.string().max(2000),reference:z.string().max(100),publicationContact:z.object({name:z.string().trim().min(1).max(80).optional(),phone:z.string().trim().min(1).max(30).optional(),messengerDemo:z.boolean().optional(),messengerUrl:z.string().url().max(500).optional()}).optional()});
export async function GET(){try{const user=await currentUser();if(!user)return Response.json({error:'Inicia sesión para continuar.'},{status:401});return Response.json(await getWorkspace(user.id),{headers:{'Cache-Control':'no-store'}});}catch(error){console.error('TuCasa workspace load failed',error);return Response.json({error:'No se pudo cargar tu espacio. Vuelve a intentarlo.'},{status:503});}}
export async function POST(request:Request){
  try{
    const user=await currentUser();if(!user)return Response.json({error:'Inicia sesión para continuar.'},{status:401});
    const body=z.record(z.unknown()).parse(await request.json());
    if(body.action==='favorite') {const data=propertySchema.parse(body.property);await favorite(user.id,data as Property,z.boolean().parse(body.active));}
    else if(body.action==='profile') {const data=z.object({company:z.string().trim().min(2).max(80),advisor:z.string().trim().max(80)}).parse(body);const existing=await getWorkspace(user.id);await saveProfile(user.id,{...existing.profile,...data});}
    else if(body.action==='checkout') {const data=z.object({plan:z.enum(['inicial','equipo','empresa']),method:z.enum(['qr','tigo','card','transfer'])}).parse(body);if(!PLANS.some(p=>p.id===data.plan))throw new Error('Plan inválido');const existing=await getWorkspace(user.id);await saveProfile(user.id,{...existing.profile,plan:data.plan,paymentMethod:data.method,activatedAt:new Date().toISOString()});}
    else if(body.action==='clearHistory')await clearHistory(user.id);
    else if(body.action==='support'){const data=z.object({message:z.string().trim().min(10).max(2000)}).parse(body);const reference=await saveSupport(user.id,data.message);return Response.json({reference});}
    else return Response.json({error:'La acción no es válida.'},{status:400});
    return Response.json(await getWorkspace(user.id),{headers:{'Cache-Control':'no-store'}});
  }catch(error){if(!(error instanceof z.ZodError))console.error('TuCasa workspace action failed',error);return Response.json({error:error instanceof z.ZodError?'Revisa los datos e inténtalo nuevamente.':error instanceof Error?error.message:'No se pudo guardar el cambio.'},{status:400});}
}
