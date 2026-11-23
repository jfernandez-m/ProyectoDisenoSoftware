# Entre Platos

Recomendador de restaurantes personalizado. Proyecto individual para Diseño de Software (TICS316-2-2026), UAI. Tema 1.

**En producción:** https://entre-platos.vercel.app

Una app web para encontrar dónde comer según tus gustos y dónde estás. Muestra los restaurantes cercanos en una lista y en un mapa, deja guardarlos en listas, calificarlos y compartir las listas, y con todo eso aprende tus gustos para recomendarte lugares nuevos. Mientras más usas la app, mejores son las recomendaciones.

## Índice

- [Funcionalidades](#funcionalidades)
- [Requisitos del curso](#requisitos-del-curso)
- [Arquitectura](#arquitectura)
- [Páginas](#páginas)
- [Endpoints del backend](#endpoints-del-backend)
- [Base de datos](#base-de-datos)
- [Recomendador](#recomendador)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Configuración](#configuración)
- [Cómo correrlo localmente](#cómo-correrlo-localmente)
- [Desplegar en Vercel](#desplegar-en-vercel)
- [Tecnologías](#tecnologías)

## Funcionalidades

### Restaurantes cercanos (Inicio, `/`)

- Pide permiso de ubicación al navegador y busca los 5 restaurantes más populares en 1 km a la redonda (Google Places API).
- Cada restaurante es una tarjeta con hasta 4 fotos que se deslizan, la calificación de Google en estrellas, cuántas opiniones tiene, el tipo de comida, el precio y la dirección.
- Filtros por precio ($ a $$$$) y por tipo de comida (27 tipos comunes en Chile, en `frontend/src/format.js`). Con un filtro, el backend busca los 5 restaurantes **más cercanos** que lo cumplen, aunque estén a más de 1 km: si pides mariscos y cerca solo hay pizzerías, igual aparecen los lugares de mariscos más cercanos. Sin filtros, se muestran los 5 más populares en 1 km.
- Mensajes claros mientras carga, si no das permiso de ubicación, si la búsqueda falla o si ningún restaurante calza con los filtros.
- Con sesión iniciada, cada tarjeta tiene además los botones de listas y "Tu nota", y debajo aparece "Recomendado para ti".

### Mapa (`/map`)

- Google Maps con tu ubicación y los restaurantes cercanos.
- Al hacer clic en un restaurante: nombre, calificación, dirección y un link para abrirlo en Google Maps (cómo llegar, horarios, etc.).

### Página de cada restaurante (`/restaurant/<id>`)

- Se abre al hacer clic en el nombre desde Inicio, Mapa, Listas o una lista compartida.
- Hasta 10 fotos grandes, datos del restaurante, link a Google Maps y un mapa pequeño con su ubicación.
- Con sesión iniciada: tu nota y los botones de listas.
- **Reseñas de Google:** un resumen de lo que más se comenta, escrito por Gemini (la IA de Google), y hasta 5 reseñas con autor, estrellas y fecha. Llegan en el idioma de la página.
- Abrir la página queda registrado (con sesión) y cuenta para las recomendaciones.

### Cuentas (`/login`, `/forgot-password`, `/reset-password`)

- **Login con Google (SSO)** o con **cuenta propia** de correo y contraseña. Desde la misma página se crea la cuenta (contraseña de 8 a 72 caracteres).
- Las cuentas y sesiones las maneja Supabase Auth: las contraseñas se guardan con hash bcrypt, nunca en texto plano.
- Errores traducidos: correo o contraseña incorrectos, correo ya registrado, contraseña débil, sin conexión.
- **Recuperar contraseña:** "¿Olvidaste tu contraseña?" manda un correo con un link de un solo uso a `/reset-password`, donde se elige una contraseña nueva. La respuesta es la misma exista o no la cuenta, para que nadie pueda averiguar quién está registrado.
- En el menú aparece el nombre (o el correo) del usuario y el botón para cerrar sesión.

### Listas (`/lists`)

- Dos listas: **"Quiero ir"** y **"Ya fui"**. Cada tarjeta tiene los dos botones; apretar el que está activo saca el restaurante de la lista, y apretar el otro lo cambia de lista.
- La página `/lists` muestra las dos listas con las fotos y datos de cada restaurante.
- Se guardan en Supabase y cada usuario solo ve las suyas (Row Level Security).

### Compartir listas (`/share/<id>`)

- Botón "Compartir" en cada lista: crea un link y lo copia al portapapeles.
- Cualquiera con el link ve la lista sin iniciar sesión, con el nombre de quien la comparte (nunca su correo).
- El id del link es aleatorio (uuid), así que no se pueden adivinar los links de otros. Cada lista tiene siempre el mismo link.

### Calificar restaurantes

- "Tu nota": de 1 a 5 estrellas, en Inicio, Listas y la página de cada restaurante.
- Una nota por usuario y restaurante: volver a calificar la reemplaza, y hacer clic en la misma estrella la borra.

### Recomendaciones personalizadas ("Recomendado para ti")

- En Inicio, con sesión iniciada, debajo de los restaurantes cercanos.
- Aprende tus gustos de tus notas, tus listas y los restaurantes que abriste, y recomienda 5 restaurantes cercanos que todavía no calificaste ni visitaste.
- Muestra tus tipos de comida favoritos ("Tus gustos: ...") y, en cada recomendación, por qué aparece ("Porque te gusta: Japonesa", "Porque sueles elegir $$", o que está muy bien evaluado en Google).
- Detalle del cálculo en [Recomendador](#recomendador).

### Idiomas

- Español e inglés, con textos propios (no traducción automática) en `frontend/src/locales/`.
- Selector de idioma en el menú. La elección se recuerda para la próxima visita y actualiza `<html lang>`.
- Los datos de Google (tipos de comida, reseñas, resumen de Gemini) también llegan en el idioma elegido.

### Diseño responsive

- Se adapta a celular, tablet y computador: la grilla de tarjetas pasa de 1 a varias columnas, el menú se acomoda en pantallas angostas, y el mapa y las fotos cambian de tamaño según la pantalla.

## Requisitos del curso

| Requisito | Dónde se cumple |
| --- | --- |
| Recomendar restaurantes según gustos y ubicación | `backend/api/recommendations.js` + `frontend/src/components/Recommendations.jsx` |
| Buscar restaurantes cercanos | `backend/api/restaurants.js` (Google Places) + `HomePage` y `MapPage` |
| Listas "Quiero ir" / "Ya fui" | `backend/api/lists.js`, tabla `list_items`, `ListsPage` |
| Compartir listas | `backend/api/share.js`, tabla `shared_lists`, `SharedListPage` |
| Calificar restaurantes | `backend/api/ratings.js`, tabla `ratings`, `StarRating` |
| Reseñas | `backend/api/place.js` (reseñas + resumen de Gemini), `Reviews` |
| Login con SSO | Google vía Supabase Auth (`AuthContext.loginWithGoogle`) |
| Login propio | Correo y contraseña vía Supabase Auth, con registro y recuperación de contraseña |
| Idiomas propios (es/en) | i18next con `locales/es.json` y `locales/en.json` |
| Responsive | `frontend/src/index.css` (grid `auto-fill`, `flex-wrap`, media queries) |
| Código en inglés | Todo el código, nombres y comentarios están en inglés; la interfaz, en es/en |
| Desplegado | Vercel (frontend y backend) + Supabase |

## Arquitectura

```
Navegador (frontend, React)
 ├─ /api/... ─────────────────────> backend (Vercel Functions)
 │                                    ├─ Google Places API (restaurantes, fotos, reseñas)
 │                                    └─ Supabase Postgres (listas, notas, vistas, links)
 ├─ login / registro / Google ────> Supabase Auth ──> Google (SSO)
 └─ mapa ─────────────────────────> Google Maps JavaScript API
```

Frontend y backend son dos proyectos separados en Vercel, desde el mismo repositorio:

- **`backend/`** tiene las llaves secretas (Places y la secret key de Supabase). Solo las leen las funciones de `backend/api/`, que corren en el servidor; nunca llegan al navegador.
- **`frontend/`** solo tiene llaves públicas: la URL y la publishable key de Supabase y la key de Maps (por eso empiezan con `VITE_`).
- El frontend llama a `/api/...` en su propio dominio y Vercel (o Vite, en local) le pasa la llamada al backend (`frontend/vercel.json`). Así el navegador nunca habla directo con el backend y no hace falta CORS.
- **Sesión:** el frontend inicia sesión con Supabase y manda el token en cada llamada (`Authorization: Bearer ...`, en `frontend/src/api.js`). El backend lo valida y consulta Supabase *como ese usuario*, así que las reglas de Row Level Security solo le dejan tocar sus propias filas.
- **Costos de Google:** el backend solo pide los campos que usa (field masks) y las fotos y reseñas quedan en caché del navegador (un día y una hora).

## Páginas

| Ruta | Página | Sesión | Qué muestra |
| --- | --- | --- | --- |
| `/` | `HomePage` | Opcional | Restaurantes cercanos con filtros; con sesión, notas, listas y recomendaciones |
| `/map` | `MapPage` | No | Mapa con tu ubicación y los restaurantes cercanos |
| `/restaurant/:id` | `RestaurantPage` | Opcional | Fotos, datos, mapa y reseñas de un restaurante; con sesión, nota y listas |
| `/lists` | `ListsPage` | Sí | Tus listas "Quiero ir" y "Ya fui", con botón para compartir |
| `/share/:id` | `SharedListPage` | No | Una lista compartida, pública para quien tenga el link |
| `/login` | `LoginPage` | No | Login y registro, con Google o correo y contraseña |
| `/forgot-password` | `ForgotPasswordPage` | No | Pide el correo para mandar el link de recuperación |
| `/reset-password` | `ResetPasswordPage` | Link del correo | Elegir una contraseña nueva |

## Endpoints del backend

Cada archivo de `backend/api/` es una Vercel Function y su nombre es la ruta. "Sesión: Sí" significa que sin token válido responde `401`.

| Método y ruta | Sesión | Qué hace |
| --- | --- | --- |
| `GET /api/restaurants?lat=&lng=&radius=&cuisine=&price=` | No | Sin filtros: los 5 más populares en el radio (por defecto 1000 m). Con `cuisine` (tipo de Google) o `price`: los 5 más cercanos que cumplen el filtro. Google no filtra por precio, así que el precio se filtra en el backend sobre los 20 más populares en 5 km |
| `GET /api/photo?name=&size=600\|1200` | No | Una foto de Google, sin exponer la key. Solo acepta nombres de fotos reales |
| `GET /api/place?id=&lang=es\|en` | No | Un restaurante: datos, hasta 10 fotos, ubicación, 5 reseñas y el resumen de Gemini |
| `GET /api/lists` | Sí | Tus restaurantes guardados en listas |
| `POST /api/lists` | Sí | Agrega un restaurante a una lista o lo cambia de lista |
| `DELETE /api/lists?placeId=` | Sí | Saca un restaurante de tus listas |
| `POST /api/share` | Sí | Crea (o devuelve) el link para compartir una de tus listas |
| `GET /api/share?id=` | No | La lista compartida de ese link |
| `GET /api/ratings` | Sí | Tus notas |
| `POST /api/ratings` | Sí | Califica un restaurante (1 a 5) o cambia la nota |
| `DELETE /api/ratings?placeId=` | Sí | Borra tu nota |
| `POST /api/views` | Sí | Registra que abriste la página de un restaurante |
| `GET /api/recommendations?lat=&lng=` | Sí | Tu perfil de gustos y 5 recomendaciones con su motivo |

Códigos de error: `400` parámetros que faltan o son inválidos, `401` sin sesión, `404` no existe, `502` falló Google o Supabase.

## Base de datos

Postgres en Supabase. El SQL completo está en [`backend/supabase/schema.sql`](backend/supabase/schema.sql): se corre una vez en Supabase → SQL Editor (se puede volver a correr sin duplicar nada). Las cuentas de usuario viven en `auth.users`, que maneja Supabase Auth.

| Tabla | Para qué | Columnas principales | Única por |
| --- | --- | --- | --- |
| `list_items` | Restaurantes en "Quiero ir" (`pending`) o "Ya fui" (`visited`) | `user_id`, `place_id`, `status`, `name`, `address`, `cuisine`, `rating`, `price_level`, `photo` | usuario + restaurante |
| `shared_lists` | Links para compartir listas; el `id` (uuid aleatorio) va en `/share/<id>` | `id`, `user_id`, `status`, `owner_name` | usuario + lista |
| `ratings` | Tu nota de 1 a 5 estrellas | `user_id`, `place_id`, `stars`, `name`, `cuisine`, `price_level` | usuario + restaurante |
| `views` | Restaurantes cuya página abriste | `user_id`, `place_id`, `cuisine`, `price_level`, `viewed_at` | usuario + restaurante |

- **Row Level Security** en todas las tablas: cada usuario solo puede leer y escribir sus filas (`(select auth.uid()) = user_id`).
- `user_id` se llena solo con el usuario de la sesión y se borra en cascada si se borra la cuenta.
- La única excepción es `GET /api/share`: la página pública no tiene sesión, así que usa la secret key (`service_role`) para leer **solo** la lista de ese link. Por eso `service_role` tiene permiso de lectura, y nada más, en `list_items` y `shared_lists`.

## Recomendador

Filtrado basado en contenido, en `backend/api/recommendations.js`:

1. **Tu perfil de gustos.** Cada señal suma puntos al tipo de comida y al rango de precio del restaurante:
   - Nota: 5★ +2, 4★ +1, 3★ 0, 2★ −1, 1★ −2
   - Estar en una lista ("Quiero ir" o "Ya fui"): +1
   - Haber abierto su página: +0,5
2. **Candidatos.** Busca restaurantes en 2 km: los más populares y los de tus 3 tipos de comida favoritos.
3. **Filtro.** Deja fuera los que ya calificaste o marcaste como visitados.
4. **Puntaje.** `2 × puntos del tipo de comida + puntos del precio + (rating de Google − 4)`. El tipo de comida pesa el doble porque dice más de tus gustos que el precio.
5. **Resultado.** Los 5 con más puntaje, cada uno con el motivo por el que aparece (tipo de comida, precio, o rating de Google ≥ 4,5). Sin datos tuyos todavía, todos los puntos son 0 y gana el rating de Google: la página lo explica y muestra los mejor evaluados cerca.

## Estructura del proyecto

```
.
├── README.md
├── backend/                      API: proyecto de Vercel con Root Directory "backend"
│   ├── .env.example              Variables del backend (sin valores)
│   ├── package.json              "npm start" = vercel dev en el puerto 3001
│   ├── api/                      Cada archivo es un endpoint /api/<nombre>
│   │   ├── restaurants.js        Restaurantes cercanos
│   │   ├── photo.js              Proxy de fotos de Google
│   │   ├── place.js              Detalle de un restaurante + reseñas + resumen de Gemini
│   │   ├── lists.js              Listas "Quiero ir" / "Ya fui"
│   │   ├── share.js              Links para compartir listas
│   │   ├── ratings.js            Notas de 1 a 5 estrellas
│   │   ├── views.js              Restaurantes abiertos por el usuario
│   │   └── recommendations.js    Recomendador
│   ├── lib/                      Código compartido por los endpoints (no son endpoints)
│   │   ├── places.js             Llamadas a Google Places y formato propio de restaurante
│   │   └── supabase.js           authenticate() (cliente como el usuario) y admin() (secret key)
│   └── supabase/
│       └── schema.sql            Tablas, Row Level Security y permisos
└── frontend/                     App en React: proyecto de Vercel con Root Directory "frontend"
    ├── .env.example              Variables del frontend (sin valores)
    ├── index.html                HTML base, título e ícono
    ├── package.json              Dependencias y scripts (dev, build, lint)
    ├── vite.config.js            Vite + proxy de /api al backend en local
    ├── vercel.json               En producción: /api → backend, el resto → index.html
    ├── eslint.config.js          Reglas de ESLint
    ├── public/
    │   └── favicon.png           Ícono de la pestaña
    └── src/
        ├── main.jsx              Punto de entrada: monta React con el router y la sesión
        ├── App.jsx               Rutas de la app
        ├── api.js                apiFetch(): fetch al backend con el token de la sesión
        ├── supabase.js           Cliente de Supabase del navegador
        ├── i18n.js               Configuración de idiomas (recuerda la elección)
        ├── format.js             Precios ($ a $$$$), tipos de comida del filtro y sus nombres
        ├── index.css             Todos los estilos y variables de diseño
        ├── locales/
        │   ├── es.json           Textos en español
        │   └── en.json           Textos en inglés
        ├── auth/
        │   └── AuthContext.jsx   Sesión: login, registro, Google, logout, recuperar contraseña
        ├── hooks/
        │   ├── useNearbyRestaurants.js   Ubicación + restaurantes cercanos
        │   ├── useLists.js               Listas del usuario
        │   ├── useRatings.js             Notas del usuario
        │   └── useRecommendations.js     Recomendaciones
        ├── components/
        │   ├── Layout.jsx                Menú (links, idioma, usuario) y página actual
        │   ├── RestaurantCard.jsx        Tarjeta de restaurante en Inicio
        │   ├── SavedRestaurantCard.jsx   Tarjeta de restaurante guardado en una lista
        │   ├── GoogleRating.jsx          Estrellas y cantidad de opiniones de Google
        │   ├── StarRating.jsx            "Tu nota": 5 estrellas clicables
        │   ├── ListButtons.jsx           Botones "Quiero ir" / "Ya fui"
        │   ├── Reviews.jsx               Resumen de Gemini y reseñas
        │   └── Recommendations.jsx       "Recomendado para ti"
        └── pages/
            ├── HomePage.jsx              /
            ├── MapPage.jsx               /map
            ├── RestaurantPage.jsx        /restaurant/:id
            ├── ListsPage.jsx             /lists
            ├── SharedListPage.jsx        /share/:id
            ├── LoginPage.jsx             /login
            ├── ForgotPasswordPage.jsx    /forgot-password
            └── ResetPasswordPage.jsx     /reset-password
```

Los archivos `.env` con las llaves reales no están en el repositorio (`.gitignore`); solo los `.env.example`.

## Configuración

Necesitas [Node.js](https://nodejs.org) 20 o superior, una cuenta en [Vercel](https://vercel.com), un proyecto en [Supabase](https://supabase.com) y un proyecto en Google Cloud con:

- Una **API key** con **Places API (New)** activada. Es secreta, solo va en el backend.
- Una **segunda API key** para el mapa, con **Maps JavaScript API** activada, restringida a sitios web (`http://localhost:5173/*` y la URL del frontend en Vercel).
- Un **ID de cliente de OAuth** de tipo "Aplicación web", con la URL de callback de Supabase (`https://<proyecto>.supabase.co/auth/v1/callback`) en **URIs de redireccionamiento autorizados**.

En Supabase:

- **SQL Editor**: corre [`backend/supabase/schema.sql`](backend/supabase/schema.sql) para crear las tablas.
- **Authentication → Sign In / Providers**: Email activado (sin confirmación de correo) y Google activado con el ID y el secreto de cliente de OAuth. El secreto solo va aquí, nunca en el código.
- **Authentication → URL Configuration → Redirect URLs**: agrega `http://localhost:5173`, `http://localhost:5173/reset-password`, la URL del frontend en Vercel y `<URL del frontend>/reset-password`.
- **Correos**: el servidor de correo de prueba de Supabase solo envía a los miembros del proyecto y tiene un límite bajo por hora. Para que usuarios reales reciban el correo de recuperación hay que configurar un SMTP propio en Authentication → Emails.

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
- `SUPABASE_SECRET_KEY`: en Supabase → Project Settings → API Keys → Secret keys. Se salta las reglas de acceso, así que solo va en el backend; solo la usa el endpoint de listas compartidas.

Después:

```bash
npm start
```

Corre `vercel dev` en `http://localhost:3001`. La primera vez pide iniciar sesión en Vercel y vincular el proyecto. Si agregas un archivo nuevo en `api/`, reinícialo.

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

Para revisar el código: `npm run lint` en `frontend/`.

## Desplegar en Vercel

Son dos proyectos de Vercel desde el mismo repositorio. Cada push a `main` los vuelve a desplegar solos.

1. **Backend**: Add New → Project, importa el repo, **Root Directory** `backend`, las 4 variables de `backend/.env`. Deploy y copia su URL.
2. En `frontend/vercel.json`, pon esa URL en el destino de `/api/:path*` (hoy es `https://entre-platos-backend.vercel.app`) y haz commit.
3. **Frontend**: Add New → Project, mismo repo, **Root Directory** `frontend`, variables `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` y `VITE_GOOGLE_MAPS_API_KEY`. Deploy.
4. Agrega la URL del frontend en Supabase (Redirect URLs, también con `/reset-password`) y en las restricciones de la key de Maps.

## Tecnologías

- **Frontend:** React 19 con Vite y React Router
- **Backend:** Vercel Functions (Node.js) en `backend/api/`
- **Base de datos y usuarios:** Supabase (Postgres con Row Level Security, y Auth con correo y contraseña y Google como SSO)
- **Traducciones:** i18next y react-i18next, con textos propios en `frontend/src/locales/`
- **Google Places API (New)** en el backend: restaurantes, fotos, reseñas y resumen de Gemini
- **Google Maps JavaScript API** en el frontend, con `@vis.gl/react-google-maps`
- **ESLint** para revisar el código
