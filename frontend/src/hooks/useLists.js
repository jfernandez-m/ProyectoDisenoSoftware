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

  // Adds the restaurant, or moves it to the other list. The new row goes first.
  async function save(place, status) {
    const saved = await apiFetch('/api/lists', {
      method: 'POST',
      body: JSON.stringify({ place, status }),
    })
    setItems((current) => [saved, ...(current ?? []).filter((item) => item.place_id !== place.id)])
  }

  async function remove(placeId) {
    await apiFetch(`/api/lists?placeId=${encodeURIComponent(placeId)}`, { method: 'DELETE' })
    setItems((current) => current.filter((item) => item.place_id !== placeId))
  }

  // 'pending', 'visited' or undefined if the restaurant is in no list.
  const statusOf = (placeId) => items?.find((item) => item.place_id === placeId)?.status

  return { items: user ? items : null, statusOf, save, remove }
}
