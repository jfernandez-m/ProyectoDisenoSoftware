// Shared by the pages that show restaurants.

// Google's price levels mapped to the symbols we show. PRICE_LEVEL_FREE is left out on purpose.
export const PRICE_LABELS = {
  PRICE_LEVEL_INEXPENSIVE: '$',
  PRICE_LEVEL_MODERATE: '$$',
  PRICE_LEVEL_EXPENSIVE: '$$$',
  PRICE_LEVEL_VERY_EXPENSIVE: '$$$$',
}

// The cuisine filter on the home page: common types in Chile, as Google names them.
// The backend asks Google for the nearest restaurants of the chosen type.
export const CUISINE_FILTERS = [
  'barbecue_restaurant',
  'bakery',
  'brunch_restaurant',
  'cafe',
  'chicken_restaurant',
  'chilean_restaurant',
  'chinese_restaurant',
  'dessert_shop',
  'fast_food_restaurant',
  'hamburger_restaurant',
  'indian_restaurant',
  'italian_restaurant',
  'japanese_restaurant',
  'korean_restaurant',
  'mediterranean_restaurant',
  'mexican_restaurant',
  'peruvian_restaurant',
  'pizza_restaurant',
  'ramen_restaurant',
  'sandwich_shop',
  'seafood_restaurant',
  'spanish_restaurant',
  'steak_house',
  'sushi_restaurant',
  'thai_restaurant',
  'vegan_restaurant',
  'vegetarian_restaurant',
]

// Google sends types like "japanese_restaurant". If we have no translation we show "japanese".
export const cuisineLabel = (t, type) =>
  t(`cuisine.${type}`, {
    defaultValue: type.replace(/_restaurant$/, '').replaceAll('_', ' '),
  })
