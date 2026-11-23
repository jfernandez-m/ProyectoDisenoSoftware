// Tests for GET /api/restaurants (api/restaurants.js), including the cuisine and price filters.
// Google is replaced by a fake fetch, so the tests don't need the API key or spend quota.
import assert from 'node:assert/strict'
import { afterEach, describe, mock, test } from 'node:test'
import { GET } from '../api/restaurants.js'

const HOME = { lat: -33.4489, lng: -70.6693 } // Santiago centro

// A place in Google's format, `km` kilometers north of HOME (1 km ≈ 0.009° of latitude).
function googlePlace(id, { km = 0, priceLevel, rating = 4.5, type = 'restaurant' } = {}) {
  return {
    id,
    displayName: { text: `Restaurant ${id}` },
    formattedAddress: 'Somewhere 123',
    location: { latitude: HOME.lat + km * 0.009, longitude: HOME.lng },
    primaryType: type,
    rating,
    priceLevel,
    userRatingCount: 10,
    photos: [],
  }
}

// Makes the fake Google answer with these places, and returns the mock to inspect its calls.
const fakeGoogle = (places) => mock.method(globalThis, 'fetch', async () => Response.json({ places }))

// Calls the endpoint like Vercel would.
const get = (query) => GET(new Request(`http://localhost/api/restaurants?${query}`))
const at = (extra = '') => `lat=${HOME.lat}&lng=${HOME.lng}${extra}`

// What we asked Google in the first fetch call.
const googleBody = (fetch) => JSON.parse(fetch.mock.calls[0].arguments[1].body)

afterEach(() => mock.restoreAll())

describe('invalid parameters: 400 without calling Google', () => {
  const cases = {
    'missing lat and lng': '',
    'lat is not a number': 'lat=abc&lng=-70.6',
    'lat out of range': 'lat=999&lng=-70.6',
    'lng out of range': 'lat=-33.4&lng=-200',
    'radius is not a number': at('&radius=abc'),
    'radius too big': at('&radius=999999'),
    'radius negative': at('&radius=-5'),
    'unknown price': at('&price=BARATO'),
    'cuisine with strange characters': at(`&cuisine=${encodeURIComponent('<script>')}`),
  }
  for (const [name, query] of Object.entries(cases)) {
    test(name, async () => {
      const fetch = fakeGoogle([])
      const response = await get(query)
      assert.equal(response.status, 400)
      assert.equal(fetch.mock.callCount(), 0)
    })
  }
})

describe('no filters', () => {
  test('asks Google for the 5 most popular in 1 km and returns them', async () => {
    const fetch = fakeGoogle([googlePlace('a'), googlePlace('b')])
    const response = await get(at())
    assert.equal(response.status, 200)
    assert.deepEqual((await response.json()).map((r) => r.id), ['a', 'b'])

    const body = googleBody(fetch)
    assert.equal(body.maxResultCount, 5)
    assert.equal(body.rankPreference, 'POPULARITY')
    assert.equal(body.locationRestriction.circle.radius, 1000)
  })

  test('Google finds nothing: empty list', async () => {
    mock.method(globalThis, 'fetch', async () => Response.json({})) // Google sends {} with no results
    const response = await get(at())
    assert.deepEqual(await response.json(), [])
  })
})

describe('price filter', () => {
  test('only that price, nearest first, at most 5', async () => {
    const MODERATE = 'PRICE_LEVEL_MODERATE'
    const fetch = fakeGoogle([
      googlePlace('far', { km: 4, priceLevel: MODERATE }),
      googlePlace('cheap', { km: 0.1, priceLevel: 'PRICE_LEVEL_INEXPENSIVE' }),
      googlePlace('no-price', { km: 0.2 }),
      googlePlace('m1', { km: 1, priceLevel: MODERATE }),
      googlePlace('m3', { km: 3, priceLevel: MODERATE }),
      googlePlace('m2', { km: 2, priceLevel: MODERATE }),
      googlePlace('m05', { km: 0.5, priceLevel: MODERATE }),
      googlePlace('m25', { km: 2.5, priceLevel: MODERATE }),
    ])
    const response = await get(at(`&price=${MODERATE}`))
    assert.deepEqual((await response.json()).map((r) => r.id), ['m05', 'm1', 'm2', 'm25', 'm3'])

    // Google can't filter by price: we ask for the 20 most popular in 5 km and filter here.
    const body = googleBody(fetch)
    assert.equal(body.maxResultCount, 20)
    assert.equal(body.rankPreference, 'POPULARITY')
    assert.equal(body.locationRestriction.circle.radius, 5000)
  })

  test('no restaurant has that price: empty list, not an error', async () => {
    fakeGoogle([googlePlace('a', { priceLevel: 'PRICE_LEVEL_INEXPENSIVE' }), googlePlace('b')])
    const response = await get(at('&price=PRICE_LEVEL_VERY_EXPENSIVE'))
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), [])
  })
})

describe('cuisine filter', () => {
  test('asks Google for that type, nearest first, up to 50 km', async () => {
    const fetch = fakeGoogle([
      googlePlace('far', { km: 30, type: 'sushi_restaurant' }),
      googlePlace('near', { km: 1, type: 'sushi_restaurant' }),
    ])
    const response = await get(at('&cuisine=sushi_restaurant'))
    assert.deepEqual((await response.json()).map((r) => r.id), ['near', 'far'])

    const body = googleBody(fetch)
    assert.deepEqual(body.includedTypes, ['sushi_restaurant'])
    assert.equal(body.rankPreference, 'DISTANCE')
    assert.equal(body.locationRestriction.circle.radius, 50000)
  })

  test('cuisine and price together: that type, filtered by price', async () => {
    const fetch = fakeGoogle([
      googlePlace('cheap-sushi', { type: 'sushi_restaurant', priceLevel: 'PRICE_LEVEL_INEXPENSIVE' }),
      googlePlace('pricey-sushi', { type: 'sushi_restaurant', priceLevel: 'PRICE_LEVEL_EXPENSIVE' }),
    ])
    const response = await get(at('&cuisine=sushi_restaurant&price=PRICE_LEVEL_EXPENSIVE'))
    assert.deepEqual((await response.json()).map((r) => r.id), ['pricey-sushi'])
    assert.deepEqual(googleBody(fetch).includedTypes, ['sushi_restaurant'])
  })
})

describe('Google fails', () => {
  test('answers 502 (the external service failed, not our server)', async () => {
    mock.method(globalThis, 'fetch', async () => new Response('quota exceeded', { status: 429 }))
    mock.method(console, 'error', () => {}) // the endpoint logs the error; keep the test output clean
    const response = await get(at())
    assert.equal(response.status, 502)
  })
})
