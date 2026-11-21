// Backend (Vercel Function): GET /api/restaurants?lat=..&lng=..&radius=..
// Runs on Vercel's server, so the Places API key never reaches the browser.

const PLACES_URL = 'https://places.googleapis.com/v1/places:searchNearby'

// We only ask for the fields we use: Google charges by the fields requested.
const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.location',
  'places.primaryType',
  'places.rating',
  'places.priceLevel',
  'places.userRatingCount',
  'places.photos',
].join(',')

// A hotel with a restaurant inside also matches "restaurant"; we drop it by its main type.
const LODGING_TYPES = [
  'hotel',
  'lodging',
  'resort_hotel',
  'extended_stay_hotel',
  'motel',
  'hostel',
  'inn',
  'bed_and_breakfast',
  'guest_house',
]

// Finds restaurants inside a circle (radius in meters) around a coordinate.
async function searchNearbyRestaurants(latitude, longitude, radius) {
  const response = await fetch(PLACES_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify({
      includedTypes: ['restaurant'],
      excludedPrimaryTypes: LODGING_TYPES,
      maxResultCount: 5,
      locationRestriction: { circle: { center: { latitude, longitude }, radius } },
    }),
  })

  if (!response.ok) {
    throw new Error(`Places API error ${response.status}: ${await response.text()}`)
  }

  const data = await response.json()
  // Google returns {} when nothing matches, so we default to an empty list.
  // We convert to our own shape so the frontend doesn't depend on Google's format.
  return (data.places ?? []).map((place) => ({
    id: place.id,
    name: place.displayName?.text,
    address: place.formattedAddress,
    location: place.location,
    cuisine: place.primaryType,
    rating: place.rating ?? null,
    priceLevel: place.priceLevel ?? null,
    ratingCount: place.userRatingCount ?? 0,
    // Names of the first 4 photos; each image is fetched later from /api/photo.
    photos: (place.photos ?? []).slice(0, 4).map((photo) => photo.name),
  }))
}

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
    return Response.json(await searchNearbyRestaurants(latitude, longitude, radius))
  } catch (error) {
    // 502: the external service (Google) failed, not our server.
    console.error(error)
    return Response.json({ error: 'Could not fetch restaurants' }, { status: 502 })
  }
}
