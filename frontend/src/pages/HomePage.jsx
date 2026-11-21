import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import GoogleRating from '../components/GoogleRating.jsx'
import { cuisineLabel, PRICE_LABELS } from '../format.js'
import { useNearbyRestaurants } from '../hooks/useNearbyRestaurants.js'

function HomePage() {
  const { t } = useTranslation()
  const { restaurants, error } = useNearbyRestaurants()
  const [price, setPrice] = useState('') // '' = any price
  const [cuisine, setCuisine] = useState('') // '' = any cuisine

  // shortcut: filters the 10 results already loaded, move it to /api/restaurants when we ask Google for more.
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
          <li key={restaurant.id} className="card">
            {/* Horizontal strip; scroll-snap in CSS stops each photo aligned. */}
            <div className="card-photos" tabIndex={0} aria-label={t('photos')}>
              {restaurant.photos.length > 0 ? (
                restaurant.photos.map((name) => (
                  <img
                    key={name}
                    className="card-photo"
                    src={`/api/photo?name=${encodeURIComponent(name)}`}
                    alt=""
                    loading="lazy"
                  />
                ))
              ) : (
                <div className="card-photo" />
              )}
            </div>
            <div className="card-body">
              {/* The name opens the restaurant page: big photos, map, reviews and your lists. */}
              <Link to={`/restaurant/${restaurant.id}`} className="card-name">
                {restaurant.name}
              </Link>
              <GoogleRating rating={restaurant.rating} count={restaurant.ratingCount} />
              <span>
                {restaurant.cuisine && `${cuisineLabel(t, restaurant.cuisine)} · `}
                {PRICE_LABELS[restaurant.priceLevel] ?? t('noPrice')}
              </span>
              <span className="muted">{restaurant.address}</span>
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}

export default HomePage
