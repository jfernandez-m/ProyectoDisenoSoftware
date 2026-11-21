// Backend (Vercel Function): /api/lists
// GET: my list items. POST: add a restaurant or move it to the other list. DELETE: remove it.
import { authenticate } from '../lib/supabase.js'

const STATUSES = ['visited', 'pending']

// 401: we don't know who is asking.
const unauthorized = () => Response.json({ error: 'not logged in' }, { status: 401 })

export async function GET(request) {
  const auth = await authenticate(request)
  if (!auth) return unauthorized()

  const { data, error } = await auth.supabase
    .from('list_items')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

// Body: { place: { id, name, address, cuisine, rating, priceLevel, photos }, status }
export async function POST(request) {
  const auth = await authenticate(request)
  if (!auth) return unauthorized()

  const { place, status } = await request.json().catch(() => ({}))
  if (!place?.id || !place?.name || !STATUSES.includes(status)) {
    return Response.json({ error: 'place and a valid status are required' }, { status: 400 })
  }

  // upsert: creates the row, or updates it if the restaurant is already in a list.
  const { data, error } = await auth.supabase
    .from('list_items')
    .upsert(
      {
        user_id: auth.user.id,
        place_id: place.id,
        status,
        name: place.name,
        address: place.address,
        cuisine: place.cuisine,
        rating: place.rating,
        price_level: place.priceLevel,
        photo: place.photos?.[0] ?? null,
      },
      { onConflict: 'user_id,place_id' },
    )
    .select()
    .single()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

// /api/lists?placeId=...
export async function DELETE(request) {
  const auth = await authenticate(request)
  if (!auth) return unauthorized()

  const placeId = new URL(request.url).searchParams.get('placeId')
  if (!placeId) return Response.json({ error: 'placeId is required' }, { status: 400 })

  const { error } = await auth.supabase.from('list_items').delete().eq('place_id', placeId)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return new Response(null, { status: 204 })
}
