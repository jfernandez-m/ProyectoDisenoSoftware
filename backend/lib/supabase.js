import { createClient } from '@supabase/supabase-js'

// Supabase client that acts as the logged-in user, so Row Level Security only
// lets them touch their own rows. Returns null if the token is missing or invalid.
export async function authenticate(request) {
  const token = (request.headers.get('Authorization') ?? '').replace('Bearer ', '')
  if (!token) return null

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_PUBLISHABLE_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  })
  const { data, error } = await supabase.auth.getUser(token)
  if (error) return null
  return { supabase, user: data.user }
}

// Client with the secret key: skips Row Level Security. Only use it to read
// exactly what a share link allows.
export const admin = () =>
  createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false },
  })
