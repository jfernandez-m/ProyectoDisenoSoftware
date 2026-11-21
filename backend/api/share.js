// Backend (Vercel Function): /api/share
// POST (logged in): get the share link id for one of my lists.
// GET ?id= (public): the shared list, for anyone with the link.
import { admin, authenticate } from '../lib/supabase.js'

const STATUSES = ['visited', 'pending']
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(request) {
  const id = new URL(request.url).searchParams.get('id') ?? ''
  if (!UUID.test(id)) return Response.json({ error: 'invalid id' }, { status: 400 })

  const supabase = admin()
  const { data: shared } = await supabase.from('shared_lists').select('*').eq('id', id).maybeSingle()
  if (!shared) return Response.json({ error: 'not found' }, { status: 404 })

  // Only that user's rows of that list, and only the restaurant fields.
  const { data: items, error } = await supabase
    .from('list_items')
    .select('place_id, name, address, cuisine, rating, price_level, photo')
    .eq('user_id', shared.user_id)
    .eq('status', shared.status)
    .order('created_at', { ascending: false })
  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ ownerName: shared.owner_name, status: shared.status, items })
}

export async function POST(request) {
  const auth = await authenticate(request)
  if (!auth) return Response.json({ error: 'not logged in' }, { status: 401 })

  const { status } = await request.json().catch(() => ({}))
  if (!STATUSES.includes(status)) {
    return Response.json({ error: 'a valid status is required' }, { status: 400 })
  }

  // The public page shows a name; we never show the full email.
  const { user } = auth
  const ownerName = user.user_metadata.full_name ?? user.user_metadata.name ?? user.email.split('@')[0]

  // upsert: the first time creates the link, later it returns the same one.
  const { data, error } = await auth.supabase
    .from('shared_lists')
    .upsert({ user_id: user.id, status, owner_name: ownerName }, { onConflict: 'user_id,status' })
    .select('id')
    .single()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ id: data.id })
}
