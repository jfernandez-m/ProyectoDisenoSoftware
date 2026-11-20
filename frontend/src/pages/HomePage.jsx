import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNearbyRestaurants } from '../hooks/useNearbyRestaurants.js'

// Google's price levels mapped to the symbols we show. PRICE_LEVEL_FREE is left out on purpose.
const PRICE_LABELS = {
  PRICE_LEVEL_INEXPENSIVE: '$',
  PRICE_LEVEL_MODERATE: '$$',
  PRICE_LEVEL_EXPENSIVE: '$$$',
  PRICE_LEVEL_VERY_EXPENSIVE: '$$$$',
}

function HomePage() {
  const { t, i18n } = useTranslation()
  const { restaurants, error } = useNearbyRestaurants()
  const [price, setPrice] = useState('') // '' = any price
  const [cuisine, setCuisine] = useState('') // '' = any cuisine

  // Google sends types like "japanese_restaurant". If we have no translation we show "japanese".
  const cuisineLabel = (type) =>
    t(`cuisine.${type}`, {
      defaultValue: type.replace(/_restaurant$/, '').replaceAll('_', ' '),
    })

  // shortcut: filters the 10 results already loaded, move it to the backend when we ask Google for more.
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
              {cuisineLabel(type)}
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
              <strong className="card-name">{restaurant.name}</strong>
              {restaurant.rating ? (
                <span className="rating">
                  {/* --rating tells the CSS how much of the five stars to paint. */}
                  <span className="stars" style={{ '--rating': restaurant.rating }} aria-hidden="true">
                    ★★★★★
                  </span>
                  {/* toLocaleString uses Intl: "4,5" in Spanish, "4.5" in English. */}
                  <strong>
                    {restaurant.rating.toLocaleString(i18n.language, {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                    })}
                  </strong>
                  <span className="muted">
                    ({t('reviews', { count: restaurant.ratingCount })})
                  </span>
                </span>
              ) : (
                <span className="muted">{t('noRating')}</span>
              )}
              <span>
                {restaurant.cuisine && `${cuisineLabel(restaurant.cuisine)} · `}
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
