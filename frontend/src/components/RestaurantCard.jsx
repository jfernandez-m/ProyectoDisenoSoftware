import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { cuisineLabel, PRICE_LABELS } from '../format.js'
import GoogleRating from './GoogleRating.jsx'

// Card of the restaurant lists on the home page. children = extra content, like why we recommend it.
function RestaurantCard({ restaurant, children }) {
  const { t } = useTranslation()

  return (
    <li className="card">
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
        {children}
      </div>
    </li>
  )
}

export default RestaurantCard
