import { useEffect, useState } from 'react'

// Asks the browser for the user's location and loads the nearby restaurants from our backend.
// Shared by the list (HomePage) and the map (MapPage) so both pages work the same way.
export function useNearbyRestaurants() {
  const [position, setPosition] = useState(null) // { lat, lng } of the user
  const [restaurants, setRestaurants] = useState(null) // null = still loading
  // We store the translation key, not the text, so the message changes with the language.
  const [error, setError] = useState(navigator.geolocation ? '' : 'errors.noGeolocation')

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        setPosition({ lat: coords.latitude, lng: coords.longitude })
        try {
          const response = await fetch(
            `/api/restaurants?lat=${coords.latitude}&lng=${coords.longitude}`,
          )
          if (!response.ok) throw new Error(`HTTP ${response.status}`)
          setRestaurants(await response.json())
        } catch {
          setError('errors.loadFailed')
        }
      },
      () => setError('errors.locationDenied'),
    )
  }, [])

  return { position, restaurants, error }
}
