import { useTranslation } from 'react-i18next'
import { cuisineLabel, PRICE_LABELS } from '../format.js'
import { useRecommendations } from '../hooks/useRecommendations.js'
import RestaurantCard from './RestaurantCard.jsx'

// "Recommended for you": what the user's taste looks like, and 5 restaurants with the reason for each.
function Recommendations({ position }) {
  const { t } = useTranslation()
  const { data, error } = useRecommendations(position)

  // The backend sends reasons as data ({ type, ... }); we turn them into text in the current language.
  const reasonText = (reason) => {
    if (reason.type === 'cuisine') {
      return t('recommendations.because.cuisine', { cuisine: cuisineLabel(t, reason.cuisine) })
    }
    if (reason.type === 'price') {
      return t('recommendations.because.price', { price: PRICE_LABELS[reason.priceLevel] ?? '' })
    }
    return t('recommendations.because.topRated')
  }

  return (
    <section className="recommendations">
      <h2>{t('recommendations.title')}</h2>
      {error && <p role="alert">{t('recommendations.failed')}</p>}
      {!error && !data && <p className="muted">{t('loading')}</p>}
      {data && (
        <>
          <p className="muted">
            {data.favoriteCuisines.length > 0
              ? t('recommendations.yourTaste', {
                  cuisines: data.favoriteCuisines.map((type) => cuisineLabel(t, type)).join(', '),
                })
              : t('recommendations.noProfile')}
          </p>
          {data.restaurants.length === 0 && <p className="muted">{t('recommendations.none')}</p>}
          <ul className="restaurant-list">
            {data.restaurants.map((restaurant) => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant}>
                {restaurant.reasons.length > 0 && (
                  <span className="reason">{restaurant.reasons.map(reasonText).join(' · ')}</span>
                )}
              </RestaurantCard>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

export default Recommendations
