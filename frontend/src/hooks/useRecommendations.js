import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'
import { apiFetch } from '../api.js'

// Personalized recommendations around a position ({ lat, lng }), for the logged-in user.
export function useRecommendations(position) {
  const { user } = useAuth()
  const email = user?.email // the user object is new on every token refresh; the email isn't
  const [data, setData] = useState(null) // null = still loading
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!email || !position) return
    apiFetch(`/api/recommendations?lat=${position.lat}&lng=${position.lng}`)
      .then(setData)
      .catch(() => setError(true))
  }, [email, position])

  return { data, error }
}
