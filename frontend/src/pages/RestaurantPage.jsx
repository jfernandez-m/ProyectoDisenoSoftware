import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'
import { AdvancedMarker, APIProvider, Map } from '@vis.gl/react-google-maps'
import { useAuth } from '../auth/AuthContext.jsx'
import GoogleRating from '../components/GoogleRating.jsx'
import ListButtons from '../components/ListButtons.jsx'
import Reviews from '../components/Reviews.jsx'
import StarRating from '../components/StarRating.jsx'
import { cuisineLabel, PRICE_LABELS } from '../format.js'
import { useLists } from '../hooks/useLists.js'
import { useRatings } from '../hooks/useRatings.js'

// One restaurant: big photos, its data, your rating and lists, a map and the Google reviews.
// It loads everything by id, so it also works when opened from a shared link.
function RestaurantPage() {
  const { t, i18n } = useTranslation()
  const { id } = useParams() // the <id> in /restaurant/<id>
  const { user } = useAuth()
  const lists = useLists()
  const ratings = useRatings()
  const [place, setPlace] = useState(null)
  const [error, setError] = useState(false)
  const lang = i18n.resolvedLanguage

  // Load again if the restaurant or the language changes (reviews come in the page's language).
  useEffect(() => {
    fetch(`/api/place?id=${encodeURIComponent(id)}&lang=${lang}`)
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then(setPlace)
      .catch(() => setError(true))
  }, [id, lang])

  if (error) return <p role="alert">{t('restaurant.notFound')}</p>
  if (!place) return <p>{t('loading')}</p>

  // Our backend sends { latitude, longitude }; Google Maps expects { lat, lng }.
  const position = { lat: place.location.latitude, lng: place.location.longitude }

  return (
    <article>
      <Link to="/" className="back-link">
        ← {t('restaurant.back')}
      </Link>

      {/* Same native carousel as the cards, with bigger photos. */}
      <div className="gallery" tabIndex={0} aria-label={t('photos')}>
        {place.photos.length > 0 ? (
          place.photos.map((name) => (
            <img
              key={name}
              className="gallery-photo"
              src={`/api/photo?name=${encodeURIComponent(name)}&size=1200`}
              alt=""
              loading="lazy"
            />
          ))
        ) : (
          <div className="gallery-photo" />
        )}
      </div>

      <div className="restaurant-info">
        <h1>{place.name}</h1>
        <GoogleRating rating={place.rating} count={place.ratingCount} />
        <span>
          {place.cuisine && `${cuisineLabel(t, place.cuisine)} · `}
          {PRICE_LABELS[place.priceLevel] ?? t('noPrice')}
        </span>
        <span className="muted">{place.address}</span>
        <a href={place.googleMapsUri} target="_blank" rel="noreferrer">
          {t('map.openInGoogleMaps')}
        </a>

        {user ? (
          <>
            <StarRating place={place} ratings={ratings} />
            <ListButtons place={place} lists={lists} />
          </>
        ) : (
          <Link to="/login">{t('restaurant.loginToSave')}</Link>
        )}
      </div>

      <section>
        <h2>{t('restaurant.location')}</h2>
        <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
          {/* key: a new map when the restaurant changes, so it centers on the new one. */}
          <Map
            key={place.id}
            className="map map-small"
            defaultCenter={position}
            defaultZoom={16}
            mapId="DEMO_MAP_ID"
          >
            <AdvancedMarker position={position} title={place.name} />
          </Map>
        </APIProvider>
      </section>

      <section>
        <h2>{t('restaurant.reviews')}</h2>
        <Reviews summary={place.summary} reviews={place.reviews} />
      </section>
    </article>
  )
}

export default RestaurantPage
