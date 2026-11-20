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
- Mensajes claros mientras carga, si no das permiso de ubicación o si el backend no responde
- Página de inicio de sesión (`/login`) con dos opciones: Google (SSO) o una cuenta propia con usuario y contraseña. Desde la misma página se puede crear la cuenta
- Las contraseñas se guardan como hash PBKDF2 con salt, nunca en texto plano
- Botón para cerrar sesión, con el nombre del usuario en el menú
- Sesiones con una cookie `HttpOnly` que dura 7 días
- Página de mapa (`/map`) con Google Maps: tu ubicación, los restaurantes cercanos y, al hacer clic en uno, su nombre, calificación, dirección y un link para abrirlo en Google Maps

## Qué falta

- Recomendaciones basadas en lo que has buscado y calificado
- Reseñas de Google y un resumen de lo que más se comenta
- Listas de restaurantes visitados y pendientes, que se pueden compartir con un link

## Cómo correrlo localmente

Necesitas [Deno](https://deno.com) 2, [Node.js](https://nodejs.org) 20 o superior y un proyecto en Google Cloud con:

- Una **API key** con **Places API (New)** activada.
- Un **ID de cliente de OAuth** de tipo "Aplicación web" (en Google Auth Platform → Clientes), con `http://localhost:5173` y `http://localhost` en **Orígenes autorizados de JavaScript**.
- Una **segunda API key** para el mapa, con **Maps JavaScript API** activada. Esta key se usa en el navegador, así que restríngela a sitios web (`http://localhost:5173/*`) y solo a Maps JavaScript API. No uses la de Places: esa queda secreta en el backend.

### 1. Backend

Solo la primera vez, para crear `backend/.env`. Si ya existe, sáltate este paso: `cp` lo reemplaza y borra tus llaves.

```bash
cd backend
cp .env.example .env
```

Abre `backend/.env` y reemplaza los valores de ejemplo:

- `GOOGLE_PLACES_API_KEY`: tu API key.
- `GOOGLE_CLIENT_ID`: tu ID de cliente de OAuth.

Después:

```bash
deno task dev
```

La API queda en `http://localhost:8000`. Los usuarios y las sesiones se guardan en Deno KV, la base de datos incluida en Deno, así que no hay que instalar nada más.

### 2. Frontend

En otra terminal. Igual que en el backend, el `cp` es solo la primera vez:

```bash
cd frontend
cp .env.example .env
```

Abre `frontend/.env` y reemplaza los valores de ejemplo:

- `VITE_GOOGLE_CLIENT_ID`: el **mismo** ID de cliente del backend.
- `VITE_GOOGLE_MAPS_API_KEY`: la key del mapa.

Después:

```bash
npm install
npm run dev
```

Abre `http://localhost:5173` y acepta el permiso de ubicación. El frontend le pasa las llamadas a `/api` al backend, así que los dos tienen que estar corriendo.

## Tecnologías

- Frontend: React con Vite y React Router
- Backend: Deno, con Deno KV para usuarios y sesiones
- Traducciones: i18next, con textos propios en `frontend/src/locales/`
- Google Places API (New) en el backend para buscar restaurantes y fotos
- Google Maps JavaScript API en el frontend, con `@vis.gl/react-google-maps`
- Inicio de sesión con Google: Google Identity Services en el frontend y verificación del token con `jose` en el backend

## Estructura

```
frontend/   app en React
backend/    API en Deno
```
