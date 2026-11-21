// Backend (Vercel Function): /api/ratings
// GET: my ratings. POST: rate a restaurant (or change the rating). DELETE: remove it.
import { authenticate } from '../lib/supabase.js'

const unauthorized = () => Response.json({ error: 'not logged in' }, { status: 401 })

export async function GET(request) {
  const auth = await authenticate(request)
  if (!auth) return unauthorized()

  const { data, error } = await auth.supabase
    .from('ratings')
    .select('place_id, stars, name, cuisine, price_level')
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

// Body: { place: { id, name, cuisine, priceLevel }, stars: 1..5 }
export async function POST(request) {
  const auth = await authenticate(request)
  if (!auth) return unauthorized()

  const { place, stars } = await request.json().catch(() => ({}))
  if (!place?.id || !place?.name || !Number.isInteger(stars) || stars < 1 || stars > 5) {
    return Response.json({ error: 'place and stars (1 to 5) are required' }, { status: 400 })
  }

  // upsert: one rating per user and restaurant; rating again replaces it.
  const { data, error } = await auth.supabase
    .from('ratings')
    .upsert(
      {
        user_id: auth.user.id,
        place_id: place.id,
        stars,
        name: place.name,
        cuisine: place.cuisine,
        price_level: place.priceLevel,
      },
      { onConflict: 'user_id,place_id' },
    )
    .select('place_id, stars, name, cuisine, price_level')
    .single()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

// /api/ratings?placeId=...
export async function DELETE(request) {
  const auth = await authenticate(request)
  if (!auth) return unauthorized()

  const placeId = new URL(request.url).searchParams.get('placeId')
  if (!placeId) return Response.json({ error: 'placeId is required' }, { status: 400 })

  const { error } = await auth.supabase.from('ratings').delete().eq('place_id', placeId)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return new Response(null, { status: 204 })
}
