import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'
import { apiFetch } from '../api.js'

// The logged-in user's list items, plus functions to change them.
export function useLists() {
  const { user } = useAuth()
  const [items, setItems] = useState(null) // null = still loading

  // Load again every time the user changes (login, logout, Google redirect).
  useEffect(() => {
    if (!user) return
    apiFetch('/api/lists').then(setItems).catch(() => setItems([]))
  }, [user])

  // Optimistic: changes the screen right away and saves in the background.
  // If saving fails, puts the old items back and throws so the button shows the error.
  // Adds the restaurant, or moves it to the other list. The new row goes first.
  async function save(place, status) {
    const previous = items
    const row = {
      place_id: place.id,
      status,
      name: place.name,
      address: place.address,
      cuisine: place.cuisine,
      rating: place.rating,
      price_level: place.priceLevel,
      photo: place.photos?.[0] ?? null,
    }
    setItems((current) => [row, ...(current ?? []).filter((item) => item.place_id !== place.id)])
    try {
      await apiFetch('/api/lists', { method: 'POST', body: JSON.stringify({ place, status }) })
    } catch (error) {
      setItems(previous)
      throw error
    }
  }

  async function remove(placeId) {
    const previous = items
    setItems((current) => current.filter((item) => item.place_id !== placeId))
    try {
      await apiFetch(`/api/lists?placeId=${encodeURIComponent(placeId)}`, { method: 'DELETE' })
    } catch (error) {
      setItems(previous)
      throw error
    }
  }

  // 'pending', 'visited' or undefined if the restaurant is in no list.
  const statusOf = (placeId) => items?.find((item) => item.place_id === placeId)?.status

  return { items: user ? items : null, statusOf, save, remove }
}
