import { createClient } from '@supabase/supabase-js'

// One shared Supabase client. The URL and publishable key are public by design:
// Supabase protects the data on its side, so they can live in the browser.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
)
