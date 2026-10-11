import { z } from 'zod';
import { TYPES, ALL_SOURCES, MUNICIPALITIES, AMENITIES, type Filters } from '@/lib/tucasa';
import { interpretFilters, generateResults } from '@/lib/search-engine';
import { currentUser, saveSearch } from '@/lib/workspace-server';
const boundedNumber = z.string().max(16).refine(v=>v===''||Number.isFinite(Number(v))&&Number(v)>=0&&Number(v)<=1e12);
export const filtersSchema=z.object({
  type:z.string().refine(v=>v===''||TYPES.some(t=>t.id===v)),operation:z.enum(['venta','alquiler','anticretico']),
  bedrooms:z.string().refine(v=>v===''||/^(?:[0-9]|10)$/.test(v)),bathrooms:z.string().refine(v=>v===''||/^(?:[1-9]|10)$/.test(v)),
  municipality:z.string().refine(v=>v==='all'||MUNICIPALITIES.some(m=>m.name===v)),zone:z.string().trim().max(100),currency:z.enum(['USD','BOB']),
  minPrice:boundedNumber,maxPrice:boundedNumber,minArea:boundedNumber,maxArea:boundedNumber,
  amenities:z.array(z.string().refine(v=>AMENITIES.some(a=>a.id===v))).max(10),sources:z.array(z.string().refine(v=>ALL_SOURCES.some(s=>s.id===v))).max(9),details:z.string().trim().max(2000),
});
export async function POST(request:Request) {
  try {
    const input=filtersSchema.safeParse(await request.json());if(!input.success)return Response.json({errors:['Revisa los campos obligatorios y los valores numéricos del formulario.']},{status:400});
    const result=interpretFilters(input.data as Filters);
    if(result.errors.length)return Response.json({errors:result.errors},{status:422});
    const search=generateResults(result.filters,result.interpreted,result.excluded);
    // The public beta search returns catalog data without opening a private
    // workspace. Platform-owned records still require real platform identity.
    if(request.headers.get('x-tucasa-beta')!=='1') {
      const user=await currentUser();
      if(user)await saveSearch(user.id,search.id,search.filters,search.properties.length);
    }
    return Response.json(search,{headers:{'Cache-Control':'no-store'}});
  } catch(error) {console.error('TuCasa search failed',error);return Response.json({error:'No se pudo completar la búsqueda. Tus datos siguen en el formulario; vuelve a intentarlo.'},{status:503});}
}
