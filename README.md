# TuCasa · Beta académica

Buscador privado para inmobiliarias, con propiedades y fotografías ficticias en el departamento de Santa Cruz, Bolivia.

## Recorrido principal

1. Seleccionar tipo de inmueble, operación y dormitorios cuando corresponda.
2. Completar presupuesto, superficie, ubicación, características y orígenes opcionales.
3. Escribir requisitos en lenguaje natural. Un clasificador local entrenado y validaciones revisan el texto, las cantidades, las negaciones y las contradicciones.
4. Buscar: primero se muestra **Mapa**. **Otros Inmuebles** contiene únicamente Facebook Marketplace, El Deber · Llave en Mano y otros enlaces o redes. Las inmobiliarias se presentan en Mapa.
5. Abrir fichas, guardar favoritos, copiar una ficha ficticia y retomar búsquedas del historial.

Las búsquedas válidas producen un catálogo de demostración adaptado a los filtros. Las propiedades no constituyen inventario real. Las seis inmobiliarias y tres fuentes externas son referencias; no existen conexiones a sus feeds o a Facebook.

## Espacio de trabajo

El acceso privado utiliza la identidad de ChatGPT proporcionada por Sites. Los endpoints comprueban esa identidad y limitan favoritos, búsquedas, perfil y consultas al usuario autenticado. Cloudflare D1 conserva estos datos. La página utiliza la protección privada de Sites y no inicia una segunda redirección de acceso. Para solicitudes heredadas con correo autenticado pero sin identificador, usa una clave de compatibilidad SHA-256; las solicitudes sin identidad no pueden acceder a datos ni realizar escrituras. El perfil local de desarrollo es exclusivo de `NODE_ENV=development`.

Los planes Inicial, Equipo y Empresa, la prueba de 14 días y los medios de pago son ilustrativos. El QR contiene texto explícitamente marcado como demo. No se cobran pagos ni se recopilan datos bancarios. La gestión comercial de equipos no está integrada en esta beta.

## Datos y recursos

- Cartografía: Leaflet y teselas de OpenStreetMap, con atribución visible. El mapa carga las imágenes mediante una ruta del propio sitio, con fuente fija y caché, sin depender de WebGL ni de workers de mapa.
- Límite departamental: geoBoundaries gbOpen Bolivia ADM1.
- 56 municipios en el selector; centros urbanos corregidos con nodos de ciudades, pueblos y aldeas de OpenStreetMap.
- Ubicaciones del catálogo ilustrativo: puntos interiores de huellas de edificios y superficies abiertas de OpenStreetMap, seleccionados por tipo y zona. Las áreas barriales son aproximadas para búsqueda, no límites administrativos. No identifican anuncios reales. Si falta una referencia adecuada, la ficha aparece solamente en Otros Inmuebles.
- Fotografías: 36 modelos de inmueble con tres vistas relacionadas por modelo (108 fotografías) en seis categorías. Las galerías conservan el índice del inmueble en fachada, interior y vista complementaria, con luz diurna y materiales coherentes. Los terrenos muestran parcela y acceso; los proyectos respetan la etapa de obra. Se optimizan como WebP.
- Resultados: cantidades variables, selección equilibrada de inmobiliarias, con prioridad moderada para Century 21 y RE/MAX y seis estilos de anuncio con descripciones cortas y extensas, con o sin emojis.
- Logos de inmobiliarias: archivos originales de sus páginas oficiales; procedencia en public/agencies/sources.json. Las copias PNG tienen dimensiones fijas y un respaldo integrado para recuperar una carga fallida. Se utilizan únicamente como referencias de origen del prototipo.
- Zona o barrio: selector de veinte áreas habituales, asociado con las referencias geográficas y su municipio.
- Identidad: logo TuCasa elegido por el usuario; verde bosque, bronce, marfil y grafito.

## Desarrollo

Usar el gestor y los scripts del proyecto. Generar cambios de esquema con `pnpm db:generate`. El despliegue conserva el binding D1 `DB` y aplica las migraciones de `drizzle/` mediante Sites. Compilar con `pnpm build` y revisar tipos con `tsc --noEmit`.

El registro WebMCP expone lectura de la búsqueda, búsqueda ficticia con filtros y apertura de fichas cuando el navegador soporta la API. La vista y las operaciones usan el mismo estado. El soporte WebMCP se detecta sin bloquear navegadores que no lo ofrecen.
