// The recommender's logic, without Google or Supabase, so it can be tested with plain data.
// Used by /api/recommendations.

const RESULTS = 5

// Adds points to one key of a { key: points } object.
// The generic type "restaurant" says nothing about the user's taste, so it doesn't count.
function addPoints(scores, key, points) {
  if (!key || key === 'restaurant') return
  scores[key] = (scores[key] ?? 0) + points
}

// The user's taste: points per cuisine and per price level.
//   rating: 5★ +2, 4★ +1, 3★ 0, 2★ -1, 1★ -2
//   in a list ("visited" or "pending"): +1
//   opened its page: +0.5
export function buildProfile(ratings, listItems, views) {
  const signals = [
    ...ratings.map((row) => [row, row.stars - 3]),
    ...listItems.map((row) => [row, 1]),
    ...views.map((row) => [row, 0.5]),
  ]
  const cuisines = {}
  const prices = {}
  for (const [row, points] of signals) {
    addPoints(cuisines, row.cuisine, points)
    addPoints(prices, row.price_level, points)
  }
  return { cuisines, prices }
}

// The keys with positive points, highest first.
export const favorites = (scores) =>
  Object.entries(scores)
    .filter(([, points]) => points > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => key)

// Scores the candidates and returns the best ones, each with the reasons it is recommended.
// `known` holds the ids the user already rated or visited: we recommend something new.
export function rankRestaurants(candidates, profile, known) {
  const scored = new Map() // id -> restaurant; a Map also removes the ones both searches found
  for (const restaurant of candidates) {
    if (known.has(restaurant.id) || scored.has(restaurant.id)) continue

    const cuisinePoints = profile.cuisines[restaurant.cuisine] ?? 0
    const pricePoints = profile.prices[restaurant.priceLevel] ?? 0
    // Cuisine weighs double: it says more about taste than price. Google's rating breaks ties.
    const score = 2 * cuisinePoints + pricePoints + ((restaurant.rating ?? 4) - 4)

    // Why we recommend it, so the page can explain it.
    const reasons = []
    if (cuisinePoints > 0) reasons.push({ type: 'cuisine', cuisine: restaurant.cuisine })
    if (pricePoints > 0) reasons.push({ type: 'price', priceLevel: restaurant.priceLevel })
    if (reasons.length === 0 && restaurant.rating >= 4.5) reasons.push({ type: 'topRated' })

    scored.set(restaurant.id, { ...restaurant, score, reasons })
  }

  // sort is stable: on a tie, the candidates keep Google's order (most popular first).
  return [...scored.values()].sort((a, b) => b.score - a.score).slice(0, RESULTS)
}
