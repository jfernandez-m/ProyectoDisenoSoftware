# Entre Platos

Personalized restaurant recommender. Individual project for Software Design (TICS316-2-2026), UAI. Topic 1.

**In production:** https://entre-platos.vercel.app

A web app to find where to eat based on your taste and where you are. It shows nearby restaurants in a list and on a map, lets you save them to lists, rate them and share the lists, and uses all of that to learn your taste and recommend new places. The more you use the app, the better the recommendations get.

## Contents

- [Features](#features)
- [Course requirements](#course-requirements)
- [Architecture](#architecture)
- [Pages](#pages)
- [Backend endpoints](#backend-endpoints)
- [Database](#database)
- [Recommender](#recommender)
- [Project structure](#project-structure)
- [Setup](#setup)
- [Running it locally](#running-it-locally)
- [Deploying to Vercel](#deploying-to-vercel)
- [Technologies](#technologies)

## Features

### Nearby restaurants (Home, `/`)

- Asks the browser for location permission and finds the 5 most popular restaurants within 1 km (Google Places API).
- Each restaurant is a card with up to 4 swipeable photos, the Google rating in stars, how many reviews it has, the cuisine, the price and the address.
- Filters by price ($ to $$$$) and by cuisine (27 types common in Chile, in `frontend/src/format.js`). With a filter, the backend finds the 5 **nearest** restaurants that match it, even if they are more than 1 km away: if you ask for seafood and only pizzerias are close by, the nearest seafood places still show up. Without filters, it shows the 5 most popular within 1 km.
- Clear messages while loading, if you don't grant location permission, if the search fails or if no restaurant matches the filters.
- When logged in, each card also has the list buttons and "Your rating", and "Recommended for you" appears below.

### Map (`/map`)

- Google Maps with your location and the nearby restaurants.
- Clicking a restaurant shows its name, rating, address and a link to open it in Google Maps (directions, opening hours, etc.).

### Restaurant page (`/restaurant/<id>`)

- Opens when you click the name from Home, Map, Lists or a shared list.
- Up to 10 large photos, restaurant details, a link to Google Maps and a small map with its location.
- When logged in: your rating and the list buttons.
- **Google reviews:** a summary of what people mention most, written by Gemini (Google's AI), and up to 5 reviews with author, stars and date. They come in the page's language.
- Opening the page is recorded (when logged in) and counts toward recommendations.

### Accounts (`/login`, `/forgot-password`, `/reset-password`)

- **Log in with Google (SSO)** or with **your own account** using email and password. The account is created from the same page (password of 8 to 72 characters).
- Accounts and sessions are handled by Supabase Auth: passwords are stored as bcrypt hashes, never in plain text.
- Translated errors: wrong email or password, email already registered, weak password, no connection.
- **Password recovery:** "Forgot your password?" sends an email with a single-use link to `/reset-password`, where you choose a new password. The response is the same whether or not the account exists, so nobody can find out who is registered.
- The menu shows the user's name (or email) and the log out button.

### Lists (`/lists`)

- Two lists: **"Want to go"** and **"Been there"**. Each card has both buttons; pressing the active one removes the restaurant from the list, and pressing the other one moves it to that list.
- The `/lists` page shows both lists with the photos and details of each restaurant.
- They are stored in Supabase and each user only sees their own (Row Level Security).

### Sharing lists (`/share/<id>`)

- A "Share list" button on each list: it creates a link and copies it to the clipboard.
- Anyone with the link sees the list without logging in, with the name of whoever shared it (never their email).
- The link id is random (uuid), so other people's links can't be guessed. Each list always has the same link.

### Rating restaurants

- "Your rating": 1 to 5 stars, on Home, Lists and each restaurant's page.
- One rating per user and restaurant: rating again replaces it, and clicking the same star deletes it.

### Personalized recommendations ("Recommended for you")

- On Home, when logged in, below the nearby restaurants.
- Learns your taste from your ratings, your lists and the restaurants you opened, and recommends 5 nearby restaurants you haven't rated or visited yet.
- Shows your favorite cuisines ("Your taste: ...") and, on each recommendation, why it appears ("Because you like: Japanese", "Because you usually pick $$", or that it is very well rated on Google).
- Details of the calculation in [Recommender](#recommender).

### Languages

- Spanish and English, with our own texts (no machine translation) in `frontend/src/locales/`.
- Language selector in the menu. The choice is remembered for the next visit and updates `<html lang>`.
- Google's data (cuisines, reviews, Gemini summary) also comes in the chosen language.

### Responsive design

- Adapts to phone, tablet and computer: the card grid goes from 1 to several columns, the menu rearranges on narrow screens, and the map and photos resize with the screen.

## Course requirements

| Requirement | Where it is met |
| --- | --- |
| Recommend restaurants based on taste and location | `backend/api/recommendations.js` + `frontend/src/components/Recommendations.jsx` |
| Search nearby restaurants | `backend/api/restaurants.js` (Google Places) + `HomePage` and `MapPage` |
| "Want to go" / "Been there" lists | `backend/api/lists.js`, `list_items` table, `ListsPage` |
| Share lists | `backend/api/share.js`, `shared_lists` table, `SharedListPage` |
| Rate restaurants | `backend/api/ratings.js`, `ratings` table, `StarRating` |
| Reviews | `backend/api/place.js` (reviews + Gemini summary), `Reviews` |
| SSO login | Google via Supabase Auth (`AuthContext.loginWithGoogle`) |
| Own login | Email and password via Supabase Auth, with sign-up and password recovery |
| Own languages (es/en) | i18next with `locales/es.json` and `locales/en.json` |
| Responsive | `frontend/src/index.css` (`auto-fill` grid, `flex-wrap`, media queries) |
| Code in English | All code, names and comments are in English; the interface is in es/en |
| Deployed | Vercel (frontend and backend) + Supabase |

## Architecture

```
Browser (frontend, React)
 ├─ /api/... ─────────────────────> backend (Vercel Functions)
 │                                    ├─ Google Places API (restaurants, photos, reviews)
 │                                    └─ Supabase Postgres (lists, ratings, views, links)
 ├─ login / sign-up / Google ─────> Supabase Auth ──> Google (SSO)
 └─ map ──────────────────────────> Google Maps JavaScript API
```

Frontend and backend are two separate Vercel projects from the same repository:

- **`backend/`** holds the secret keys (Places and the Supabase secret key). Only the functions in `backend/api/` read them, and those run on the server; they never reach the browser.
- **`frontend/`** only has public keys: the Supabase URL and publishable key and the Maps key (that's why they start with `VITE_`).
- The frontend calls `/api/...` on its own domain and Vercel (or Vite, locally) forwards the call to the backend (`frontend/vercel.json`). This way the browser never talks to the backend directly and CORS isn't needed.
- **Session:** the frontend logs in with Supabase and sends the token on every call (`Authorization: Bearer ...`, in `frontend/src/api.js`). The backend validates it and queries Supabase *as that user*, so the Row Level Security rules only let it touch that user's own rows.
- **Google costs:** the backend only requests the fields it uses (field masks), and photos and reviews are cached by the browser (one day and one hour).

## Pages

| Route | Page | Session | What it shows |
| --- | --- | --- | --- |
| `/` | `HomePage` | Optional | Nearby restaurants with filters; when logged in, ratings, lists and recommendations |
| `/map` | `MapPage` | No | Map with your location and the nearby restaurants |
| `/restaurant/:id` | `RestaurantPage` | Optional | Photos, details, map and reviews of a restaurant; when logged in, rating and lists |
| `/lists` | `ListsPage` | Yes | Your "Want to go" and "Been there" lists, with a share button |
| `/share/:id` | `SharedListPage` | No | A shared list, public to anyone with the link |
| `/login` | `LoginPage` | No | Log in and sign up, with Google or email and password |
| `/forgot-password` | `ForgotPasswordPage` | No | Asks for the email to send the recovery link |
| `/reset-password` | `ResetPasswordPage` | Email link | Choose a new password |

## Backend endpoints

Each file in `backend/api/` is a Vercel Function and its name is the route. "Session: Yes" means it responds `401` without a valid token.

| Method and route | Session | What it does |
| --- | --- | --- |
| `GET /api/restaurants?lat=&lng=&radius=&cuisine=&price=` | No | Without filters: the 5 most popular within the radius (default 1000 m). With `cuisine` (Google type) or `price`: the 5 nearest that match the filter. Google doesn't filter by price, so the backend filters the price over the 20 most popular within 5 km |
| `GET /api/photo?name=&size=600\|1200` | No | A Google photo, without exposing the key. Only accepts real photo names |
| `GET /api/place?id=&lang=es\|en` | No | One restaurant: details, up to 10 photos, location, 5 reviews and the Gemini summary |
| `GET /api/lists` | Yes | Your restaurants saved in lists |
| `POST /api/lists` | Yes | Adds a restaurant to a list or moves it to the other list |
| `DELETE /api/lists?placeId=` | Yes | Removes a restaurant from your lists |
| `POST /api/share` | Yes | Creates (or returns) the link to share one of your lists |
| `GET /api/share?id=` | No | The shared list for that link |
| `GET /api/ratings` | Yes | Your ratings |
| `POST /api/ratings` | Yes | Rates a restaurant (1 to 5) or changes the rating |
| `DELETE /api/ratings?placeId=` | Yes | Deletes your rating |
| `POST /api/views` | Yes | Records that you opened a restaurant's page |
| `GET /api/recommendations?lat=&lng=` | Yes | Your taste profile and 5 recommendations with their reason |

Error codes: `400` missing or invalid parameters, `401` no session, `404` not found, `502` Google or Supabase failed.

## Database

Postgres on Supabase. The full SQL is in [`backend/supabase/schema.sql`](backend/supabase/schema.sql): run it once in Supabase → SQL Editor (it can be run again without duplicating anything). User accounts live in `auth.users`, which Supabase Auth manages.

| Table | Purpose | Main columns | Unique per |
| --- | --- | --- | --- |
| `list_items` | Restaurants in "Want to go" (`pending`) or "Been there" (`visited`) | `user_id`, `place_id`, `status`, `name`, `address`, `cuisine`, `rating`, `price_level`, `photo` | user + restaurant |
| `shared_lists` | Links to share lists; the `id` (random uuid) goes in `/share/<id>` | `id`, `user_id`, `status`, `owner_name` | user + list |
| `ratings` | Your 1 to 5 star rating | `user_id`, `place_id`, `stars`, `name`, `cuisine`, `price_level` | user + restaurant |
| `views` | Restaurants whose page you opened | `user_id`, `place_id`, `cuisine`, `price_level`, `viewed_at` | user + restaurant |

- **Row Level Security** on every table: each user can only read and write their own rows (`(select auth.uid()) = user_id`).
- `user_id` is filled in automatically with the session's user and is deleted in cascade if the account is deleted.
- The only exception is `GET /api/share`: the public page has no session, so it uses the secret key (`service_role`) to read **only** the list for that link. That's why `service_role` has read permission, and nothing else, on `list_items` and `shared_lists`.

## Recommender

Content-based filtering, in `backend/api/recommendations.js`:

1. **Your taste profile.** Each signal adds points to the restaurant's cuisine and price range:
   - Rating: 5★ +2, 4★ +1, 3★ 0, 2★ −1, 1★ −2
   - Being in a list ("Want to go" or "Been there"): +1
   - Having opened its page: +0.5
2. **Candidates.** Searches restaurants within 2 km: the most popular ones and those of your 3 favorite cuisines.
3. **Filter.** Leaves out the ones you already rated or marked as visited.
4. **Score.** `2 × cuisine points + price points + (Google rating − 4)`. Cuisine counts double because it says more about your taste than price.
5. **Result.** The 5 with the highest score, each with the reason it appears (cuisine, price, or Google rating ≥ 4.5). With no data from you yet, all points are 0 and the Google rating wins: the page explains this and shows the best rated nearby.

## Project structure

```
.
├── README.md
├── backend/                      API: Vercel project with Root Directory "backend"
│   ├── .env.example              Backend variables (without values)
│   ├── package.json              "npm start" = vercel dev on port 3001
│   ├── api/                      Each file is an endpoint /api/<name>
│   │   ├── restaurants.js        Nearby restaurants
│   │   ├── photo.js              Google photo proxy
│   │   ├── place.js              Restaurant details + reviews + Gemini summary
│   │   ├── lists.js              "Want to go" / "Been there" lists
│   │   ├── share.js              Links to share lists
│   │   ├── ratings.js            1 to 5 star ratings
│   │   ├── views.js              Restaurants opened by the user
│   │   └── recommendations.js    Recommender
│   ├── lib/                      Code shared by the endpoints (not endpoints)
│   │   ├── places.js             Google Places calls and our own restaurant format
│   │   └── supabase.js           authenticate() (client as the user) and admin() (secret key)
│   └── supabase/
│       └── schema.sql            Tables, Row Level Security and permissions
└── frontend/                     React app: Vercel project with Root Directory "frontend"
    ├── .env.example              Frontend variables (without values)
    ├── index.html                Base HTML, title and icon
    ├── package.json              Dependencies and scripts (dev, build, lint)
    ├── vite.config.js            Vite + local proxy from /api to the backend
    ├── vercel.json               In production: /api → backend, everything else → index.html
    ├── eslint.config.js          ESLint rules
    ├── public/
    │   └── favicon.png           Tab icon
    └── src/
        ├── main.jsx              Entry point: mounts React with the router and the session
        ├── App.jsx               App routes
        ├── api.js                apiFetch(): fetch to the backend with the session token
        ├── supabase.js           Browser Supabase client
        ├── i18n.js               Language setup (remembers the choice)
        ├── format.js             Prices ($ to $$$$), filter cuisines and their names
        ├── index.css             All styles and design variables
        ├── locales/
        │   ├── es.json           Spanish texts
        │   └── en.json           English texts
        ├── auth/
        │   └── AuthContext.jsx   Session: login, sign-up, Google, logout, password recovery
        ├── hooks/
        │   ├── useNearbyRestaurants.js   Location + nearby restaurants
        │   ├── useLists.js               User's lists
        │   ├── useRatings.js             User's ratings
        │   └── useRecommendations.js     Recommendations
        ├── components/
        │   ├── Layout.jsx                Menu (links, language, user) and current page
        │   ├── RestaurantCard.jsx        Restaurant card on Home
        │   ├── SavedRestaurantCard.jsx   Card of a restaurant saved in a list
        │   ├── GoogleRating.jsx          Google stars and review count
        │   ├── StarRating.jsx            "Your rating": 5 clickable stars
        │   ├── ListButtons.jsx           "Want to go" / "Been there" buttons
        │   ├── Reviews.jsx               Gemini summary and reviews
        │   └── Recommendations.jsx       "Recommended for you"
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

The `.env` files with the real keys are not in the repository (`.gitignore`); only the `.env.example` files are.

## Setup

You need [Node.js](https://nodejs.org) 20 or later, a [Vercel](https://vercel.com) account, a [Supabase](https://supabase.com) project and a Google Cloud project with:

- An **API key** with **Places API (New)** enabled. It is secret and only goes in the backend.
- A **second API key** for the map, with **Maps JavaScript API** enabled, restricted to websites (`http://localhost:5173/*` and the frontend URL on Vercel).
- An **OAuth client ID** of type "Web application", with the Supabase callback URL (`https://<project>.supabase.co/auth/v1/callback`) in **Authorized redirect URIs**.

In Supabase:

- **SQL Editor**: run [`backend/supabase/schema.sql`](backend/supabase/schema.sql) to create the tables.
- **Authentication → Sign In / Providers**: Email enabled (without email confirmation) and Google enabled with the OAuth client ID and secret. The secret only goes here, never in the code.
- **Authentication → URL Configuration → Redirect URLs**: add `http://localhost:5173`, `http://localhost:5173/reset-password`, the frontend URL on Vercel and `<frontend URL>/reset-password`.
- **Emails**: Supabase's test email server only sends to project members and has a low hourly limit. For real users to receive the recovery email you need to set up your own SMTP in Authentication → Emails.

## Running it locally

In each folder, the `cp` is only for the first time. If the `.env` already exists, skip it: `cp` replaces it and deletes your keys.

### 1. Backend

```bash
cd backend
cp .env.example .env
```

In `backend/.env` set:

- `GOOGLE_PLACES_API_KEY`: the Places key.
- `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`: the same values as in the frontend.
- `SUPABASE_SECRET_KEY`: in Supabase → Project Settings → API Keys → Secret keys. It bypasses the access rules, so it only goes in the backend; only the shared lists endpoint uses it.

Then:

```bash
npm start
```

It runs `vercel dev` on `http://localhost:3001`. The first time it asks you to log in to Vercel and link the project. If you add a new file in `api/`, restart it.

### 2. Frontend

In another terminal:

```bash
cd frontend
cp .env.example .env
```

In `frontend/.env` set:

- `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`: in Supabase → Project Settings → API Keys.
- `VITE_GOOGLE_MAPS_API_KEY`: the map key.

Then:

```bash
npm install
npm run dev
```

Open `http://localhost:5173` and accept the location permission. Vite forwards the `/api` calls to the backend, so both have to be running.

To check the code: `npm run lint` in `frontend/`.

## Deploying to Vercel

These are two Vercel projects from the same repository. Every push to `main` redeploys them automatically.

1. **Backend**: Add New → Project, import the repo, **Root Directory** `backend`, the 4 variables from `backend/.env`. Deploy and copy its URL.
2. In `frontend/vercel.json`, put that URL as the destination of `/api/:path*` (currently `https://entre-platos-backend.vercel.app`) and commit.
3. **Frontend**: Add New → Project, same repo, **Root Directory** `frontend`, variables `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` and `VITE_GOOGLE_MAPS_API_KEY`. Deploy.
4. Add the frontend URL in Supabase (Redirect URLs, also with `/reset-password`) and in the Maps key restrictions.

## Technologies

- **Frontend:** React 19 with Vite and React Router
- **Backend:** Vercel Functions (Node.js) in `backend/api/`
- **Database and users:** Supabase (Postgres with Row Level Security, and Auth with email and password and Google as SSO)
- **Translations:** i18next and react-i18next, with our own texts in `frontend/src/locales/`
- **Google Places API (New)** in the backend: restaurants, photos, reviews and Gemini summary
- **Google Maps JavaScript API** in the frontend, with `@vis.gl/react-google-maps`
- **ESLint** to check the code
