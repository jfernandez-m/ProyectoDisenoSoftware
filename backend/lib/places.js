// Shared by /api/restaurants and /api/place.

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
