# TuCasa — código fuente completo para GitHub

Esta entrega contiene los archivos originales de la versión 9 publicada el 11 de octubre de 2026. El código de la plataforma y sus recursos se conservan exactamente como estaban en el commit `6b1922a97e6424f489c585cdce8a304da18ca64d`. Esta guía y `EXPORTACION.json` son los únicos archivos añadidos para la entrega.

## Qué incluye

- Interfaz React: formulario, búsqueda, mapa, otros inmuebles, fichas, galerías, asesores, favoritos, historial y pantalla de inicio de sesión con usuario y contraseña.
- Código de las API de búsqueda, mapa y espacio de trabajo.
- Todos los logos, fotografías, geometría de Santa Cruz y referencias geográficas del proyecto.
- Estilos CSS, componentes, configuraciones, migraciones SQL, scripts y comprobaciones.
- `package.json`, `pnpm-lock.yaml` y configuración de pnpm para reinstalar las dependencias con sus versiones fijadas.

El proyecto usa React, TypeScript, Vite y Vinext, con estructura App Router, Tailwind CSS, Leaflet y un servidor Cloudflare Worker. El documento HTML se genera desde `app/layout.tsx`; no utiliza un `index.html` independiente. Las dependencias de terceros se instalan con el gestor de paquetes. `node_modules`, cachés, archivos de sesión, bases de datos locales, credenciales y resultados de compilación no forman parte del código fuente ni deben subirse a GitHub.

## Instalar y ejecutar

Necesitas Node.js 22.13 o superior y pnpm 11.25.0, según `package.json`.

1. Descomprime el ZIP y abre una terminal en la carpeta `TuCasa`, donde está `package.json`.
2. Si todavía no tienes la versión de pnpm indicada, instálala:

```bash
npm install -g pnpm@11.25.0
```

3. Instala las dependencias y abre el proyecto:

```bash
pnpm install --frozen-lockfile
pnpm dev
```

La dirección de desarrollo es `http://localhost:5173`. Si la terminal informa otra dirección, usa la que aparezca en ella. Para entrar a esta beta, completa Usuario y Contraseña con cualquier texto. La contraseña no se guarda ni se envía a un servidor.

Para compilar y ejecutar el resultado localmente:

```bash
pnpm build
pnpm start
```

`start` ejecuta Wrangler en modo local. Abre la dirección que imprima la terminal.

## Subir a GitHub

Crea un repositorio vacío en tu cuenta. Desde la carpeta `TuCasa`:

```bash
git init
git add .
git commit -m "Código fuente de TuCasa"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
git push -u origin main
```

Reemplaza `TU_USUARIO` y `TU_REPOSITORIO` por los tuyos. Si usas la interfaz web de GitHub, sube el contenido de la carpeta descomprimida, manteniendo su estructura. El `.gitignore` incluido evita subir dependencias y datos locales.

## Configuración de hosting

Subir el repositorio a GitHub conserva el proyecto. Publicar la aplicación requiere un servidor que ejecute sus API; GitHub Pages por sí solo no ejecuta el Worker ni Cloudflare D1.

La configuración de Sites de la publicación original está en `.openai/hosting.json`. Si despliegas en tu propia cuenta de Cloudflare u otro proveedor, configura sus recursos y bindings para ese entorno. El binding de base de datos es `DB`; las migraciones están en `drizzle/`. Los IDs de recursos de la configuración original no son credenciales y no crean acceso a la cuenta de hosting.

La beta mantiene favoritos e historial en el navegador y utiliza un catálogo de demostración. El inicio con cualquier usuario y contraseña es un acceso de prueba. No hay una conexión en tiempo real con inventarios de inmobiliarias, Facebook Marketplace o El Deber. Estas condiciones describen el funcionamiento actual del código entregado.

## Estructura

| Carpeta o archivo | Contenido |
| --- | --- |
| `app/` | Pantallas React, HTML del documento, CSS y rutas API. |
| `app/components/` | Mapa, formulario, anuncios, galerías y datos de contacto. |
| `components/` | Componentes de interfaz compartidos. |
| `lib/` | Motor de búsqueda, ubicaciones, modelos de datos y funciones de la beta. |
| `public/` | Logo TuCasa, logos de inmobiliarias, fotos y cartografía. |
| `db/` y `drizzle/` | Esquema de datos y migraciones SQL. |
| `build/` | Integración Vite/Worker y código necesario para hosting. |
| `scripts/` | Instalación, ejecución y comprobaciones del proyecto. |
| `vendor/` | Estilos y avisos de licencia incluidos. |
| `package.json` y `pnpm-lock.yaml` | Dependencias y versiones. |
| `vite.config.ts` y `tsconfig.json` | Configuración Vite y TypeScript. |
| `EXPORTACION.json` | Procedencia y hashes de todos los archivos originales. |
