// Backend (Vercel Function): GET /api/restaurants?lat=..&lng=..&radius=..
// Runs on Vercel's server, so the Places API key never reaches the browser.

import { searchNearby } from '../lib/places.js'

export async function GET(request) {
  const url = new URL(request.url)
  const latitude = Number(url.searchParams.get('lat'))
  const longitude = Number(url.searchParams.get('lng'))
  const radius = Number(url.searchParams.get('radius') ?? 1000)

  // 400: the client made the mistake (missing or non-numeric parameters).
  if (
    !url.searchParams.has('lat') ||
    !url.searchParams.has('lng') ||
    Number.isNaN(latitude) ||
    Number.isNaN(longitude)
  ) {
    return Response.json({ error: 'lat and lng query params are required numbers' }, { status: 400 })
  }

  try {
    return Response.json(await searchNearby({ latitude, longitude, radius, max: 5 }))
  } catch (error) {
    // 502: the external service (Google) failed, not our server.
    console.error(error)
    return Response.json({ error: 'Could not fetch restaurants' }, { status: 502 })
  }
}
