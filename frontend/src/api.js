import { supabase } from './supabase.js'

// fetch to our backend, adding the logged-in user's Supabase token so the backend knows who is asking.
export async function apiFetch(path, options = {}) {
  const { data } = await supabase.auth.getSession()
  const response = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${data.session?.access_token ?? ''}`,
    },
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.status === 204 ? null : response.json() // 204 = OK with no body (DELETE)
}
