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

## Qué falta

- Login con Google
- Recomendaciones basadas en lo que has buscado y calificado
- Mapa con los restaurantes cercanos (Google Maps)
- Reseñas de Google y un resumen de lo que más se comenta
- Listas de restaurantes visitados y pendientes, que se pueden compartir con un link

## Cómo correrlo localmente

Necesitas [Deno](https://deno.com) 2, [Node.js](https://nodejs.org) 20 o superior y una API key de Google Cloud con **Places API (New)** activada.

### 1. Backend

```bash
cd backend
cp .env.example .env
```

Abre `backend/.env` y reemplaza `your-api-key-here` por tu API key. Después:

```bash
deno task dev
```

La API queda en `http://localhost:8000`.

### 2. Frontend

En otra terminal:

```bash
cd frontend
npm install
npm run dev
```

Abre `http://localhost:5173` y acepta el permiso de ubicación. El frontend le pasa las llamadas a `/api` al backend, así que los dos tienen que estar corriendo.

## Tecnologías

- Frontend: React con Vite
- Traducciones: i18next, con textos propios en `frontend/src/locales/` 
- Google Maps / Places API

## Estructura

```
frontend/   app en React
backend/    API en Deno
```
