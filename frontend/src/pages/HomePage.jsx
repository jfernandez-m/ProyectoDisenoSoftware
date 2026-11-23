import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthContext.jsx'
import Recommendations from '../components/Recommendations.jsx'
import RestaurantCard from '../components/RestaurantCard.jsx'
import { CUISINE_FILTERS, cuisineLabel, PRICE_LABELS } from '../format.js'
import { useNearbyRestaurants } from '../hooks/useNearbyRestaurants.js'

function HomePage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [price, setPrice] = useState('') // '' = any price
  const [cuisine, setCuisine] = useState('') // '' = any cuisine
  // The backend does the filtering: with a filter it finds the nearest restaurants that match.
  const { position, restaurants, error } = useNearbyRestaurants({ cuisine, price })
  const filtered = Boolean(cuisine || price)

  // Fixed list, sorted by its name in the current language.
  const cuisines = [...CUISINE_FILTERS].sort((a, b) => cuisineLabel(t, a).localeCompare(cuisineLabel(t, b)))

  return (
    <>
      <h1>{t('title')}</h1>

      <label className="filter">
        {t('filters.price')}
        <select value={price} onChange={(event) => setPrice(event.target.value)}>
          <option value="">{t('filters.any')}</option>
          {Object.entries(PRICE_LABELS).map(([level, label]) => (
            <option key={level} value={level}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <label className="filter">
        {t('filters.cuisine')}
        <select value={cuisine} onChange={(event) => setCuisine(event.target.value)}>
          <option value="">{t('filters.any')}</option>
          {cuisines.map((type) => (
            <option key={type} value={type}>
              {cuisineLabel(t, type)}
            </option>
          ))}
        </select>
      </label>

      {filtered && <p className="muted">{t('filters.nearestHint')}</p>}

      {error && <p role="alert">{t(error)}</p>}
      {!error && !restaurants && <p>{t('loading')}</p>}
      {restaurants && restaurants.length === 0 && <p>{t(filtered ? 'noMatches' : 'noRestaurants')}</p>}

      <ul className="restaurant-list">
        {(restaurants ?? []).map((restaurant) => (
          <RestaurantCard key={restaurant.id} restaurant={restaurant} />
        ))}
      </ul>

      {/* Only with a session: recommendations come from the user's ratings, lists and views. */}
      {user && position && <Recommendations position={position} />}
    </>
  )
}

export default HomePage
