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

  async function rate(place, stars) {
    const saved = await apiFetch('/api/ratings', {
      method: 'POST',
      body: JSON.stringify({ place, stars }),
    })
    setItems((current) => [saved, ...(current ?? []).filter((item) => item.place_id !== place.id)])
  }

  async function unrate(placeId) {
    await apiFetch(`/api/ratings?placeId=${encodeURIComponent(placeId)}`, { method: 'DELETE' })
    setItems((current) => current.filter((item) => item.place_id !== placeId))
  }

  // 1..5, or undefined if the user hasn't rated it.
  const starsOf = (placeId) => items?.find((item) => item.place_id === placeId)?.stars

  return { items: user ? items : null, starsOf, rate, unrate }
}
