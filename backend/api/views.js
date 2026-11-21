// Backend (Vercel Function): POST /api/views
// Remembers that the user opened a restaurant's page. Feeds the recommender ("what you searched").
import { authenticate } from '../lib/supabase.js'

// Body: { place: { id, cuisine, priceLevel } }
export async function POST(request) {
  const auth = await authenticate(request)
  if (!auth) return Response.json({ error: 'not logged in' }, { status: 401 })

  const { place } = await request.json().catch(() => ({}))
  if (!place?.id) return Response.json({ error: 'place is required' }, { status: 400 })

  // upsert: one row per user and restaurant; opening it again only updates the date.
  const { error } = await auth.supabase.from('views').upsert(
    {
      user_id: auth.user.id,
      place_id: place.id,
      cuisine: place.cuisine,
      price_level: place.priceLevel,
      viewed_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,place_id' },
  )
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return new Response(null, { status: 204 })
}
