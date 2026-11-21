// Backend (Vercel Function): GET /api/recommendations?lat=..&lng=..
// Personalized recommendations: learns the user's taste from their ratings, lists and the
// restaurants they opened, then scores the restaurants around them.
import { searchNearby } from '../lib/places.js'
import { authenticate } from '../lib/supabase.js'

const RADIUS = 2000 // meters: wider than the nearby list, for more variety
const RESULTS = 5

// Adds points to one key of a { key: points } object.
// The generic type "restaurant" says nothing about the user's taste, so it doesn't count.
function addPoints(scores, key, points) {
  if (!key || key === 'restaurant') return
  scores[key] = (scores[key] ?? 0) + points
}

// The user's taste: points per cuisine and per price level.
//   rating: 5★ +2, 4★ +1, 3★ 0, 2★ -1, 1★ -2
//   in a list ("visited" or "pending"): +1
//   opened its page: +0.5
function buildProfile(ratings, listItems, views) {
  const signals = [
    ...ratings.map((row) => [row, row.stars - 3]),
    ...listItems.map((row) => [row, 1]),
    ...views.map((row) => [row, 0.5]),
  ]
  const cuisines = {}
  const prices = {}
  for (const [row, points] of signals) {
    addPoints(cuisines, row.cuisine, points)
    addPoints(prices, row.price_level, points)
  }
  return { cuisines, prices }
}

// The keys with positive points, highest first.
const favorites = (scores) =>
  Object.entries(scores)
    .filter(([, points]) => points > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => key)

export async function GET(request) {
  const auth = await authenticate(request)
  if (!auth) return Response.json({ error: 'not logged in' }, { status: 401 })

  const url = new URL(request.url)
  const latitude = Number(url.searchParams.get('lat'))
  const longitude = Number(url.searchParams.get('lng'))
  if (!url.searchParams.has('lat') || !url.searchParams.has('lng') || Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return Response.json({ error: 'lat and lng query params are required numbers' }, { status: 400 })
  }

  // 1. Everything we know about the user (Row Level Security: only their own rows).
  const results = await Promise.all(
    ['ratings', 'list_items', 'views'].map((table) => auth.supabase.from(table).select('*')),
  )
  const failed = results.find((result) => result.error)
  if (failed) return Response.json({ error: failed.error.message }, { status: 500 })
  const [ratings, listItems, views] = results.map((result) => result.data)

  // 2. Their taste.
  const profile = buildProfile(ratings, listItems, views)
  const favoriteCuisines = favorites(profile.cuisines).slice(0, 3)

  // 3. Candidates: the most popular restaurants around, plus restaurants of their favorite cuisines.
  let candidates
  try {
    const searches = [searchNearby({ latitude, longitude, radius: RADIUS, max: 20 })]
    if (favoriteCuisines.length > 0) {
      // Not every type Google gives a place can be searched; if it fails we keep the general search.
      searches.push(
        searchNearby({ latitude, longitude, radius: RADIUS, max: 20, types: favoriteCuisines }).catch(() => []),
      )
    }
    candidates = (await Promise.all(searches)).flat()
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'Could not fetch restaurants' }, { status: 502 })
  }

  // 4. Score them. Places the user already rated or visited are left out: we recommend something new.
  const known = new Set([
    ...ratings.map((row) => row.place_id),
    ...listItems.filter((row) => row.status === 'visited').map((row) => row.place_id),
  ])
  const scored = new Map() // id -> restaurant; a Map also removes the ones both searches found
  for (const restaurant of candidates) {
    if (known.has(restaurant.id) || scored.has(restaurant.id)) continue

    const cuisinePoints = profile.cuisines[restaurant.cuisine] ?? 0
    const pricePoints = profile.prices[restaurant.priceLevel] ?? 0
    // Cuisine weighs double: it says more about taste than price. Google's rating breaks ties.
    const score = 2 * cuisinePoints + pricePoints + ((restaurant.rating ?? 4) - 4)

    // Why we recommend it, so the page can explain it.
    const reasons = []
    if (cuisinePoints > 0) reasons.push({ type: 'cuisine', cuisine: restaurant.cuisine })
    if (pricePoints > 0) reasons.push({ type: 'price', priceLevel: restaurant.priceLevel })
    if (reasons.length === 0 && restaurant.rating >= 4.5) reasons.push({ type: 'topRated' })

    scored.set(restaurant.id, { ...restaurant, score, reasons })
  }

  // 5. The best ones.
  const restaurants = [...scored.values()].sort((a, b) => b.score - a.score).slice(0, RESULTS)
  return Response.json({ favoriteCuisines, restaurants })
}
