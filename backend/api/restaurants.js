// Backend (Vercel Function): GET /api/restaurants?lat=..&lng=..&radius=..&cuisine=..&price=..
// Runs on Vercel's server, so the Places API key never reaches the browser.
//   No filters: the 5 most popular restaurants around (radius, 1000 m by default).
//   cuisine and/or price: the 5 nearest restaurants that match, even if they are farther away.

import { searchNearby } from '../lib/places.js'

const PRICES = [
  'PRICE_LEVEL_INEXPENSIVE',
  'PRICE_LEVEL_MODERATE',
  'PRICE_LEVEL_EXPENSIVE',
  'PRICE_LEVEL_VERY_EXPENSIVE',
]
const RESULTS = 5

export async function GET(request) {
  const url = new URL(request.url)
  const latitude = Number(url.searchParams.get('lat'))
  const longitude = Number(url.searchParams.get('lng'))
  const radius = Number(url.searchParams.get('radius') ?? 1000)
  const cuisine = url.searchParams.get('cuisine') || null // a Google type, like "seafood_restaurant"
  const price = url.searchParams.get('price') || null

  // 400: the client made the mistake (missing or invalid parameters). Checked here so a bad
  // value never reaches Google, which would answer with an error (and we would send a 502).
  if (
    !url.searchParams.has('lat') ||
    !url.searchParams.has('lng') ||
    !(Math.abs(latitude) <= 90) || // also false for NaN
    !(Math.abs(longitude) <= 180) ||
    !(radius > 0 && radius <= 50000) || // Google's maximum radius is 50 km
    (cuisine && !/^[a-z_]+$/.test(cuisine)) ||
    (price && !PRICES.includes(price))
  ) {
    return Response.json(
      { error: 'lat (-90 to 90) and lng (-180 to 180) are required; radius (1 to 50000), cuisine or price are invalid' },
      { status: 400 },
    )
  }

  try {
    if (!cuisine && !price) {
      return Response.json(await searchNearby({ latitude, longitude, radius, max: RESULTS }))
    }

    // Google can search by type, but not by price, so the price is filtered here.
    // Most places near you have no price on Google; the popular ones usually do, so with a
    // price we take the 20 most popular in 5 km. Without one, the 20 nearest of that cuisine,
    // up to 50 km (Google's maximum), so a cuisine that isn't around still shows results.
    const found = await searchNearby({
      latitude,
      longitude,
      radius: price ? 5000 : 50000,
      max: 20,
      types: [cuisine ?? 'restaurant'],
      byDistance: !price,
    })

    // Nearest first. Comparing squared differences is enough to sort; the longitude is
    // scaled because its degrees get shorter away from the equator.
    const scale = Math.cos((latitude * Math.PI) / 180)
    const distance = (r) =>
      (r.location.latitude - latitude) ** 2 + ((r.location.longitude - longitude) * scale) ** 2

    const matches = found
      .filter((r) => !price || r.priceLevel === price)
      .sort((a, b) => distance(a) - distance(b))
      .slice(0, RESULTS)
    return Response.json(matches)
  } catch (error) {
    // 502: the external service (Google) failed, not our server.
    console.error(error)
    return Response.json({ error: 'Could not fetch restaurants' }, { status: 502 })
  }
}
