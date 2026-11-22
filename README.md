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
- Recuperar contraseña: "¿Olvidaste tu contraseña?" en el login manda un correo con un link de un solo uso a `/reset-password`, donde se elige una contraseña nueva. Requiere agregar `<URL>/reset-password` en Supabase → Redirect URLs. El correo de prueba de Supabase solo envía a los miembros del proyecto; para usuarios reales hay que configurar un SMTP propio
- Botón para cerrar sesión, con el nombre (o correo) del usuario en el menú
- Página de mapa (`/map`) con Google Maps: tu ubicación, los restaurantes cercanos y, al hacer clic en uno, su nombre, calificación, dirección y un link para abrirlo en Google Maps
- Listas "Quiero ir" y "Ya fui": cada tarjeta tiene dos botones para guardar el restaurante, y la página `/lists` muestra las dos listas. Se guardan en Supabase y cada usuario solo ve las suyas
- Compartir una lista con un link (`/share/<id>`): cualquiera con el link la ve sin iniciar sesión. El link usa un id aleatorio, así que no se pueden adivinar los de otros
- Calificar restaurantes con 1 a 5 estrellas ("Tu nota") en Inicio y en Listas. Se guarda una nota por usuario y restaurante; hacer clic en la misma estrella la borra
- Página de cada restaurante (`/restaurant/<id>`), al hacer clic en su nombre desde Inicio, Mapa o Listas: fotos grandes, datos, link a Google Maps, mapa con su ubicación, tu nota y los botones de listas (si iniciaste sesión), y las reseñas de Google con un resumen de lo que más se comenta, escrito por Gemini. Las reseñas llegan en el idioma de la página
- Recomendaciones personalizadas ("Recomendado para ti", en Inicio con sesión iniciada). El backend arma tu perfil de gustos con tus notas, tus listas y los restaurantes que abriste: cada señal suma puntos al tipo de comida y al rango de precio (5★ +2, 4★ +1, 3★ 0, 2★ −1, 1★ −2; en una lista +1; abierto +0,5). Después busca restaurantes cerca (los más populares y los de tus 3 tipos de comida favoritos), deja fuera los que ya calificaste o visitaste, y ordena con `2 × puntos del tipo de comida + puntos del precio + (rating de Google − 4)`. Cada recomendación dice por qué aparece

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

En `backend/.env` pon:

- `GOOGLE_PLACES_API_KEY`: la key de Places.
- `SUPABASE_URL` y `SUPABASE_PUBLISHABLE_KEY`: los mismos valores que en el frontend.
- `SUPABASE_SECRET_KEY`: en Supabase → Project Settings → API Keys → Secret keys. Se salta las reglas de acceso, así que solo va en el backend; el endpoint de listas compartidas la usa para leer solo la lista del link.

Después:

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

1. **Backend**: Add New → Project, importa el repo, **Root Directory** `backend`, las 4 variables de `backend/.env`. Deploy y copia su URL.
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
