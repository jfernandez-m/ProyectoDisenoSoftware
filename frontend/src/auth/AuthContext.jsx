import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabase.js'

const AuthContext = createContext(null)

// Supabase's user has the name in different places depending on how they signed up.
function toUser(session) {
  if (!session) return null
  const { email, user_metadata: metadata } = session.user
  return { email, name: metadata.full_name ?? metadata.name ?? email }
}

// Supabase answers with { error } instead of throwing; we throw its code so the page can translate it.
function throwIfError({ error }) {
  if (error) throw new Error(error.code ?? 'network')
}

// Shares who is logged in with every page. Supabase keeps the session (in localStorage)
// and tells us whenever it changes: login, logout, token refresh, or coming back from Google.
export function AuthProvider({ children }) {
  // undefined = still asking Supabase, null = not logged in, object = logged in.
  const [user, setUser] = useState(undefined)

  useEffect(() => {
    // Fires right away with the current session, and again on every change.
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(toUser(session)))
    return () => data.subscription.unsubscribe()
  }, [])

  const value = {
    user,
    login: async (email, password) =>
      throwIfError(await supabase.auth.signInWithPassword({ email, password })),
    register: async (email, password) =>
      throwIfError(await supabase.auth.signUp({ email, password })),
    // Leaves our site for Google; Supabase brings the user back here already logged in.
    loginWithGoogle: async () =>
      throwIfError(
        await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: window.location.origin },
        }),
      ),
    logout: async () => throwIfError(await supabase.auth.signOut()),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components -- the hook belongs next to its provider
export function useAuth() {
  return useContext(AuthContext)
}
