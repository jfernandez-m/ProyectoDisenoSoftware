// Shared by the pages that show restaurants.

// Google's price levels mapped to the symbols we show. PRICE_LEVEL_FREE is left out on purpose.
export const PRICE_LABELS = {
  PRICE_LEVEL_INEXPENSIVE: '$',
  PRICE_LEVEL_MODERATE: '$$',
  PRICE_LEVEL_EXPENSIVE: '$$$',
  PRICE_LEVEL_VERY_EXPENSIVE: '$$$$',
}

// Google sends types like "japanese_restaurant". If we have no translation we show "japanese".
export const cuisineLabel = (t, type) =>
  t(`cuisine.${type}`, {
    defaultValue: type.replace(/_restaurant$/, '').replaceAll('_', ' '),
  })
