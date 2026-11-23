// Shared by /api/restaurants, /api/place and /api/recommendations.

// The Google fields we show for every restaurant. We only ask for what we use: Google charges by field.
export const PLACE_FIELDS = [
  'id',
  'displayName',
  'formattedAddress',
  'location',
  'primaryType',
  'rating',
  'priceLevel',
  'userRatingCount',
  'photos',
]

// Converts a Google place to our own shape, so the frontend doesn't depend on Google's format.
export function toRestaurant(place, maxPhotos) {
  return {
    id: place.id,
    name: place.displayName?.text,
    address: place.formattedAddress,
    location: place.location,
    cuisine: place.primaryType,
    rating: place.rating ?? null,
    priceLevel: place.priceLevel ?? null,
    ratingCount: place.userRatingCount ?? 0,
    // Photo names; each image is fetched later from /api/photo.
    photos: (place.photos ?? []).slice(0, maxPhotos).map((photo) => photo.name),
  }
}

const SEARCH_NEARBY_URL = 'https://places.googleapis.com/v1/places:searchNearby'

// searchNearby returns a list, so every field goes under "places.".
const SEARCH_FIELD_MASK = PLACE_FIELDS.map((field) => `places.${field}`).join(',')

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

// Finds up to `max` (1 to 20) places of the given types inside a circle (radius in meters),
// most popular first, or nearest first with byDistance. Throws if Google fails.
export async function searchNearby({ latitude, longitude, radius, max, types = ['restaurant'], byDistance = false }) {
  const response = await fetch(SEARCH_NEARBY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY,
      'X-Goog-FieldMask': SEARCH_FIELD_MASK,
    },
    body: JSON.stringify({
      includedTypes: types,
      excludedPrimaryTypes: LODGING_TYPES,
      maxResultCount: max,
      rankPreference: byDistance ? 'DISTANCE' : 'POPULARITY',
      locationRestriction: { circle: { center: { latitude, longitude }, radius } },
    }),
  })

  if (!response.ok) {
    throw new Error(`Places API error ${response.status}: ${await response.text()}`)
  }

  const data = await response.json()
  // Google returns {} when nothing matches, so we default to an empty list.
  return (data.places ?? []).map((place) => toRestaurant(place, 4))
}
