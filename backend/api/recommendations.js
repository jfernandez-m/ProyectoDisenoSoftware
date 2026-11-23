// Backend (Vercel Function): GET /api/recommendations?lat=..&lng=..
// Personalized recommendations: learns the user's taste from their ratings, lists and the
// restaurants they opened, then scores the restaurants around them.
// The scoring itself lives in lib/recommender.js, where it is tested.
import { searchNearby } from '../lib/places.js'
import { buildProfile, favorites, rankRestaurants } from '../lib/recommender.js'
import { authenticate } from '../lib/supabase.js'

const RADIUS = 2000 // meters: wider than the nearby list, for more variety

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

  // 4. Score them and keep the best. Places the user already rated or visited are left out.
  const known = new Set([
    ...ratings.map((row) => row.place_id),
    ...listItems.filter((row) => row.status === 'visited').map((row) => row.place_id),
  ])
  const restaurants = rankRestaurants(candidates, profile, known)
  return Response.json({ favoriteCuisines, restaurants })
}
