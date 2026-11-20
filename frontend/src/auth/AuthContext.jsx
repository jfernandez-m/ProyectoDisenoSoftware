import { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext(null)

// POSTs JSON to the backend; the session cookie travels on its own (same origin thanks to the Vite proxy).
// On failure it throws the backend's error code (e.g. "invalidCredentials") so the page can translate it.
async function postJson(path, body) {
  let response
  try {
    response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    throw new Error('network')
  }
  const data = response.status === 204 ? null : await response.json().catch(() => null)
  if (!response.ok) throw new Error(data?.error ?? 'network')
  return data
}

// Shares who is logged in with every page, so each page doesn't have to ask the backend.
export function AuthProvider({ children }) {
  // undefined = still asking the backend, null = not logged in, object = logged in.
  const [user, setUser] = useState(undefined)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((response) => (response.ok ? response.json() : null))
      .then(setUser)
      .catch(() => setUser(null))
  }, [])

  const value = {
    user,
    login: async (username, password) =>
      setUser(await postJson('/api/auth/login', { username, password })),
    register: async (username, password) =>
      setUser(await postJson('/api/auth/register', { username, password })),
    loginWithGoogle: async (credential) =>
      setUser(await postJson('/api/auth/google', { credential })),
    logout: async () => {
      await postJson('/api/auth/logout', {})
      setUser(null)
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components -- the hook belongs next to its provider
export function useAuth() {
  return useContext(AuthContext)
}
