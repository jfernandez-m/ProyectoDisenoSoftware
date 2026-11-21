// Backend (Vercel Function): GET /api/place?id=..&lang=es
// Everything the restaurant page shows: data, up to 10 photos, location, Google reviews
// and Google's AI summary of them ("what people say most").
import { PLACE_FIELDS, toRestaurant } from '../lib/places.js'

const LANGUAGES = ['es', 'en']
const FIELD_MASK = [...PLACE_FIELDS, 'googleMapsUri', 'reviews', 'reviewSummary'].join(',')

export async function GET(request) {
  const url = new URL(request.url)
  const id = url.searchParams.get('id') ?? ''
  const lang = LANGUAGES.includes(url.searchParams.get('lang')) ? url.searchParams.get('lang') : 'es'

  // Only real place ids, so nobody can use this endpoint to call other URLs with our key.
  if (!/^[\w-]+$/.test(id)) {
    return Response.json({ error: 'invalid id' }, { status: 400 })
  }

  // Place Details: one restaurant by its id, with the texts in the page's language.
  const response = await fetch(`https://places.googleapis.com/v1/places/${id}?languageCode=${lang}`, {
    headers: {
      'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY,
      'X-Goog-FieldMask': FIELD_MASK,
    },
  })
  // Google answers 400/404 when the id doesn't exist.
  if (response.status === 400 || response.status === 404) {
    return Response.json({ error: 'not found' }, { status: 404 })
  }
  if (!response.ok) {
    console.error(`Places details error ${response.status}: ${await response.text()}`)
    return Response.json({ error: 'Could not fetch the restaurant' }, { status: 502 })
  }

  const place = await response.json()
  const summary = place.reviewSummary
  return Response.json(
    {
      ...toRestaurant(place, 10),
      googleMapsUri: place.googleMapsUri,
      // Written by Gemini; Google only has it in some countries and languages, so it can be null.
      summary: summary ? { text: summary.text?.text, disclosure: summary.disclosureText?.text } : null,
      // Up to 5 reviews. Google requires showing the author with a link to their profile.
      reviews: (place.reviews ?? []).map((review) => ({
        id: review.name,
        author: review.authorAttribution?.displayName,
        authorUri: review.authorAttribution?.uri,
        rating: review.rating,
        time: review.relativePublishTimeDescription,
        text: review.text?.text ?? '',
      })),
    },
    // Reviews change slowly: the browser keeps the page's data for an hour.
    { headers: { 'Cache-Control': 'public, max-age=3600' } },
  )
}
