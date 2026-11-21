// Backend (Vercel Function): GET /api/photo?name=places/../photos/..
// The browser asks for photos here so the Places API key never leaves the server.

export async function GET(request) {
  const name = new URL(request.url).searchParams.get('name') ?? ''
  // Only real photo names are accepted, so nobody can use this endpoint to call other URLs with our key.
  if (!/^places\/[\w-]+\/photos\/[\w-]+$/.test(name)) {
    return Response.json({ error: 'invalid photo name' }, { status: 400 })
  }

  const response = await fetch(
    `https://places.googleapis.com/v1/${name}/media?maxWidthPx=600&key=${process.env.GOOGLE_PLACES_API_KEY}`,
  )
  if (!response.ok) {
    console.error(`Places photo error ${response.status}`)
    return Response.json({ error: 'Could not fetch photo' }, { status: 502 })
  }

  return new Response(response.body, {
    headers: {
      'Content-Type': response.headers.get('Content-Type') ?? 'image/jpeg',
      // Google charges per photo: the browser keeps it for a day instead of asking again.
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
