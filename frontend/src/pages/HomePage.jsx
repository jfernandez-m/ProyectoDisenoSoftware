import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthContext.jsx'
import Recommendations from '../components/Recommendations.jsx'
import RestaurantCard from '../components/RestaurantCard.jsx'
import { cuisineLabel, PRICE_LABELS } from '../format.js'
import { useNearbyRestaurants } from '../hooks/useNearbyRestaurants.js'

function HomePage() {
  const { t } = useTranslation()
  const { position, restaurants, error } = useNearbyRestaurants()
  const { user } = useAuth()
  const [price, setPrice] = useState('') // '' = any price
  const [cuisine, setCuisine] = useState('') // '' = any cuisine

  // shortcut: filters the 5 results already loaded, move it to /api/restaurants when we ask Google for more.
  const visible = (restaurants ?? []).filter(
    (r) => (!price || r.priceLevel === price) && (!cuisine || r.cuisine === cuisine),
  )
  // The options come from the loaded restaurants, so every option has at least one result.
  const cuisines = [...new Set((restaurants ?? []).map((r) => r.cuisine).filter(Boolean))].sort()

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

      {error && <p role="alert">{t(error)}</p>}
      {!error && !restaurants && <p>{t('loading')}</p>}
      {restaurants && visible.length === 0 && <p>{t('noMatches')}</p>}

      <ul className="restaurant-list">
        {visible.map((restaurant) => (
          <RestaurantCard key={restaurant.id} restaurant={restaurant} />
        ))}
      </ul>

      {/* Only with a session: recommendations come from the user's ratings, lists and views. */}
      {user && position && <Recommendations position={position} />}
    </>
  )
}

export default HomePage
