import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'
import { apiFetch } from '../api.js'

// The logged-in user's ratings, plus functions to change them.
export function useRatings() {
  const { user } = useAuth()
  const [items, setItems] = useState(null) // null = still loading

  // Load again every time the user changes (login, logout, Google redirect).
  useEffect(() => {
    if (!user) return
    apiFetch('/api/ratings').then(setItems).catch(() => setItems([]))
  }, [user])

  // Optimistic, like the lists: the stars change right away; if saving fails they go back.
  async function rate(place, stars) {
    const previous = items
    const row = { place_id: place.id, stars, name: place.name, cuisine: place.cuisine, price_level: place.priceLevel }
    setItems((current) => [row, ...(current ?? []).filter((item) => item.place_id !== place.id)])
    try {
      await apiFetch('/api/ratings', { method: 'POST', body: JSON.stringify({ place, stars }) })
    } catch (error) {
      setItems(previous)
      throw error
    }
  }

  async function unrate(placeId) {
    const previous = items
    setItems((current) => current.filter((item) => item.place_id !== placeId))
    try {
      await apiFetch(`/api/ratings?placeId=${encodeURIComponent(placeId)}`, { method: 'DELETE' })
    } catch (error) {
      setItems(previous)
      throw error
    }
  }

  // 1..5, or undefined if the user hasn't rated it.
  const starsOf = (placeId) => items?.find((item) => item.place_id === placeId)?.stars

  return { items: user ? items : null, starsOf, rate, unrate }
}
