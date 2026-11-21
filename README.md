# Entre Platos

Recomendador de restaurantes.

Proyecto individual para Diseño de Software (TICS316-2-2026), UAI.

La idea es una app web para encontrar lugares donde comer según tus gustos y dónde estás. Mientras más restaurantes calificas y buscas, mejores deberían ser las recomendaciones.

## Qué funciona hoy

- Busca los 5 restaurantes más cercanos a tu ubicación (pide permiso de ubicación al navegador)
- Cada restaurante se muestra en una tarjeta con hasta 4 fotos que se pueden deslizar, calificación con estrellas, cantidad de opiniones, tipo de comida, precio y dirección
- Filtros por precio y tipo de comida
- Español e inglés, con selector de idioma en el menú
- Diseño responsive: se adapta a celular, tablet y computador
- Mensajes claros mientras carga, si no das permiso de ubicación o si la búsqueda falla
- Página de inicio de sesión (`/login`) con dos opciones: Google (SSO) o una cuenta propia con correo y contraseña. Desde la misma página se puede crear la cuenta
- Las cuentas y sesiones las maneja Supabase Auth: guarda las contraseñas con hash bcrypt, nunca en texto plano
- Botón para cerrar sesión, con el nombre (o correo) del usuario en el menú
- Página de mapa (`/map`) con Google Maps: tu ubicación, los restaurantes cercanos y, al hacer clic en uno, su nombre, calificación, dirección y un link para abrirlo en Google Maps
- Listas "Quiero ir" y "Ya fui": cada tarjeta tiene dos botones para guardar el restaurante, y la página `/lists` muestra las dos listas. Se guardan en Supabase y cada usuario solo ve las suyas

## Qué falta

- Recomendaciones basadas en lo que has buscado y calificado
- Reseñas de Google y un resumen de lo que más se comenta
- Compartir una lista con un link

## Cómo funciona

```
Navegador (frontend, React)
 ├─ /api/restaurants, /api/photo ──> backend (Vercel Functions) ──> Google Places API
 ├─ login / registro / Google ─────> Supabase Auth ──> Google (SSO)
 └─ mapa ──────────────────────────> Google Maps JavaScript API
```

Frontend y backend son dos proyectos separados en Vercel:

- `backend/` tiene la key de Places, que es secreta. Solo la leen las funciones de `backend/api/`, que corren en el servidor.
- `frontend/` solo tiene llaves públicas: la URL y la publishable key de Supabase y la key de Maps (por eso empiezan con `VITE_`).
- El frontend llama a `/api/...` en su propio dominio y Vercel (o Vite, en local) le pasa la llamada al backend. Así el navegador nunca habla directo con el backend y no hace falta CORS.

## Configuración

Necesitas [Node.js](https://nodejs.org) 20 o superior, una cuenta en [Vercel](https://vercel.com), un proyecto en [Supabase](https://supabase.com) y un proyecto en Google Cloud con:

- Una **API key** con **Places API (New)** activada. Es secreta, solo va en el backend.
- Una **segunda API key** para el mapa, con **Maps JavaScript API** activada, restringida a sitios web (`http://localhost:5173/*` y la URL del frontend en Vercel).
- Un **ID de cliente de OAuth** de tipo "Aplicación web", con la URL de callback de Supabase (`https://<proyecto>.supabase.co/auth/v1/callback`) en **URIs de redireccionamiento autorizados**.

En Supabase → Authentication:

- **Sign In / Providers**: Email activado (sin confirmación de correo) y Google activado con el ID y el secreto de cliente de OAuth. El secreto solo va aquí, nunca en el código.
- **URL Configuration**: agrega `http://localhost:5173` y la URL del frontend en Vercel en **Redirect URLs**.

## Cómo correrlo localmente

En cada carpeta, el `cp` es solo la primera vez. Si el `.env` ya existe, sáltatelo: `cp` lo reemplaza y borra tus llaves.

### 1. Backend

```bash
cd backend
cp .env.example .env
```

En `backend/.env` pon tu `GOOGLE_PLACES_API_KEY`. Después:

```bash
npm start
```

Corre `vercel dev` en `http://localhost:3001`. La primera vez pide iniciar sesión en Vercel y vincular el proyecto.

### 2. Frontend

En otra terminal:

```bash
cd frontend
cp .env.example .env
```

En `frontend/.env` pon:

- `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`: en Supabase → Project Settings → API Keys.
- `VITE_GOOGLE_MAPS_API_KEY`: la key del mapa.

Después:

```bash
npm install
npm run dev
```

Abre `http://localhost:5173` y acepta el permiso de ubicación. Vite le pasa las llamadas a `/api` al backend, así que los dos tienen que estar corriendo.

## Desplegar en Vercel

Son dos proyectos de Vercel desde el mismo repositorio:

1. **Backend**: Add New → Project, importa el repo, **Root Directory** `backend`, variable `GOOGLE_PLACES_API_KEY`. Deploy y copia su URL.
2. En `frontend/vercel.json`, reemplaza `YOUR-BACKEND.vercel.app` por esa URL y haz commit.
3. **Frontend**: Add New → Project, mismo repo, **Root Directory** `frontend`, variables `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` y `VITE_GOOGLE_MAPS_API_KEY`. Deploy.
4. Agrega la URL del frontend en Supabase (Redirect URLs) y en las restricciones de la key de Maps.

## Tecnologías

- Frontend: React con Vite y React Router
- Backend: Vercel Functions (Node.js) en `backend/api/`
- Usuarios y sesiones: Supabase Auth (correo y contraseña, y Google como SSO)
- Traducciones: i18next, con textos propios en `frontend/src/locales/`
- Google Places API (New) en el backend para buscar restaurantes y fotos
- Google Maps JavaScript API en el frontend, con `@vis.gl/react-google-maps`

## Estructura

```
frontend/   app en React (proyecto de Vercel con Root Directory frontend)
backend/    API: funciones de Vercel en backend/api/ (proyecto de Vercel con Root Directory backend)
```
