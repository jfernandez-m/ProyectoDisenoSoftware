// Tests for the recommender's logic (lib/recommender.js). Run with: npm test
// Plain data in, plain data out: no Google and no Supabase.
import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { buildProfile, favorites, rankRestaurants } from '../lib/recommender.js'

// A candidate restaurant, in the shape lib/places.js returns.
const place = (id, cuisine, rating, priceLevel = null) => ({ id, cuisine, rating, priceLevel })
const ids = (restaurants) => restaurants.map((r) => r.id)
const EMPTY_PROFILE = { cuisines: {}, prices: {} }

describe('buildProfile', () => {
  test('a user with no ratings, lists or views has an empty profile', () => {
    assert.deepEqual(buildProfile([], [], []), EMPTY_PROFILE)
  })

  test('each signal adds its points to the cuisine and the price', () => {
    const profile = buildProfile(
      [
        { stars: 5, cuisine: 'sushi_restaurant', price_level: 'PRICE_LEVEL_MODERATE' }, // +2
        { stars: 1, cuisine: 'pizza_restaurant', price_level: 'PRICE_LEVEL_INEXPENSIVE' }, // -2
      ],
      [{ cuisine: 'sushi_restaurant', price_level: 'PRICE_LEVEL_MODERATE' }], // +1
      [{ cuisine: 'sushi_restaurant', price_level: null }], // +0.5, no price
    )
    assert.deepEqual(profile.cuisines, { sushi_restaurant: 3.5, pizza_restaurant: -2 })
    assert.deepEqual(profile.prices, { PRICE_LEVEL_MODERATE: 3, PRICE_LEVEL_INEXPENSIVE: -2 })
  })

  test('the generic type "restaurant" does not count as a taste', () => {
    const profile = buildProfile([{ stars: 5, cuisine: 'restaurant', price_level: null }], [], [])
    assert.deepEqual(profile, EMPTY_PROFILE)
  })
})

describe('favorites', () => {
  test('keeps only positive points, highest first', () => {
    assert.deepEqual(favorites({ chilean_restaurant: 1, sushi_restaurant: 3, pizza_restaurant: -2 }), [
      'sushi_restaurant',
      'chilean_restaurant',
    ])
  })

  test('no favorites when there is no data', () => {
    assert.deepEqual(favorites({}), [])
  })
})

describe('rankRestaurants', () => {
  test('no user ratings (cold start): Google rating decides the order', () => {
    const result = rankRestaurants(
      [place('a', 'pizza_restaurant', 4.2), place('b', 'sushi_restaurant', 4.8), place('c', 'cafe', 3.9)],
      EMPTY_PROFILE,
      new Set(),
    )
    assert.deepEqual(ids(result), ['b', 'a', 'c'])
    assert.deepEqual(result[0].reasons, [{ type: 'topRated' }]) // 4.8 ≥ 4.5
    assert.deepEqual(result[1].reasons, []) // 4.2 < 4.5: no reason to show
  })

  test('every restaurant with 5 stars and no profile: all tie and keep Google order', () => {
    const result = rankRestaurants(
      [place('a', 'pizza_restaurant', 5), place('b', 'sushi_restaurant', 5), place('c', 'cafe', 5)],
      EMPTY_PROFILE,
      new Set(),
    )
    assert.deepEqual(ids(result), ['a', 'b', 'c'])
    assert.ok(result.every((r) => r.score === 1))
    assert.ok(result.every((r) => r.reasons[0].type === 'topRated'))
  })

  test('every restaurant with 5 stars: the user taste breaks the tie', () => {
    const profile = buildProfile([{ stars: 5, cuisine: 'sushi_restaurant', price_level: null }], [], [])
    const result = rankRestaurants(
      [place('a', 'pizza_restaurant', 5), place('b', 'sushi_restaurant', 5)],
      profile,
      new Set(),
    )
    assert.deepEqual(ids(result), ['b', 'a'])
    // With a cuisine reason, "top rated" is not added.
    assert.deepEqual(result[0].reasons, [{ type: 'cuisine', cuisine: 'sushi_restaurant' }])
  })

  test('a restaurant without a Google rating counts as 4 (neither adds nor subtracts)', () => {
    const [result] = rankRestaurants([place('a', 'pizza_restaurant', null)], EMPTY_PROFILE, new Set())
    assert.equal(result.score, 0)
    assert.deepEqual(result.reasons, [])
  })

  test('a cuisine rated with 1 star sinks below a worse rated one', () => {
    const profile = buildProfile([{ stars: 1, cuisine: 'pizza_restaurant', price_level: null }], [], [])
    const result = rankRestaurants(
      [place('pizza', 'pizza_restaurant', 4.9), place('cafe', 'cafe', 3.5)],
      profile,
      new Set(),
    )
    // pizza: 2 × -2 + 0.9 = -3.1; cafe: -0.5
    assert.deepEqual(ids(result), ['cafe', 'pizza'])
  })

  test('the price the user usually picks adds points and a reason', () => {
    const profile = buildProfile([], [{ cuisine: null, price_level: 'PRICE_LEVEL_EXPENSIVE' }], [])
    const result = rankRestaurants(
      [place('cheap', 'cafe', 4, 'PRICE_LEVEL_INEXPENSIVE'), place('pricey', 'cafe', 4, 'PRICE_LEVEL_EXPENSIVE')],
      profile,
      new Set(),
    )
    assert.deepEqual(ids(result), ['pricey', 'cheap'])
    assert.deepEqual(result[0].reasons, [{ type: 'price', priceLevel: 'PRICE_LEVEL_EXPENSIVE' }])
  })

  test('leaves out restaurants already rated or visited', () => {
    const result = rankRestaurants(
      [place('rated', 'cafe', 5), place('visited', 'cafe', 5), place('new', 'cafe', 4)],
      EMPTY_PROFILE,
      new Set(['rated', 'visited']),
    )
    assert.deepEqual(ids(result), ['new'])
  })

  test('a restaurant found by both searches appears once', () => {
    const result = rankRestaurants([place('a', 'cafe', 4), place('a', 'cafe', 4)], EMPTY_PROFILE, new Set())
    assert.equal(result.length, 1)
  })

  test('returns at most 5', () => {
    const candidates = Array.from({ length: 12 }, (_, i) => place(`r${i}`, 'cafe', 4))
    assert.equal(rankRestaurants(candidates, EMPTY_PROFILE, new Set()).length, 5)
  })

  test('no candidates nearby: empty list', () => {
    assert.deepEqual(rankRestaurants([], EMPTY_PROFILE, new Set()), [])
  })
})
