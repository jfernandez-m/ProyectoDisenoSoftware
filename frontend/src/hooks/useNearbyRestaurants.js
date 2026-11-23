import { useEffect, useState } from 'react'

// Asks the browser for the user's location and loads the nearby restaurants from our /api/restaurants function.
// Shared by the list (HomePage) and the map (MapPage) so both pages work the same way.
// cuisine and price are optional filters ('' = any); changing them loads the list again.
export function useNearbyRestaurants({ cuisine = '', price = '' } = {}) {
  const [position, setPosition] = useState(null) // { lat, lng } of the user
  // The answer and the query it belongs to, so an old answer is never shown for new filters.
  const [loaded, setLoaded] = useState({ query: null, restaurants: null })
  // We store the translation key, not the text, so the message changes with the language.
  const [error, setError] = useState(navigator.geolocation ? '' : 'errors.noGeolocation')

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setPosition({ lat: coords.latitude, lng: coords.longitude }),
      () => setError('errors.locationDenied'),
    )
  }, [])

  const query = position
    ? new URLSearchParams({
        lat: position.lat,
        lng: position.lng,
        ...(cuisine && { cuisine }),
        ...(price && { price }),
      }).toString()
    : null

  useEffect(() => {
    if (!query) return
    let ignore = false // the filters changed before this answer arrived
    fetch(`/api/restaurants?${query}`)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return response.json()
      })
      .then((restaurants) => {
        if (ignore) return
        setError('')
        setLoaded({ query, restaurants })
      })
      .catch(() => !ignore && setError('errors.loadFailed'))
    return () => {
      ignore = true
    }
  }, [query])

  // null = still loading (also right after changing a filter).
  const restaurants = loaded.query === query ? loaded.restaurants : null
  return { position, restaurants, error }
}
