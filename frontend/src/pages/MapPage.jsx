import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AdvancedMarker, APIProvider, InfoWindow, Map, Pin } from '@vis.gl/react-google-maps'
import { useNearbyRestaurants } from '../hooks/useNearbyRestaurants.js'

// Google's own page for a place, so the user can get directions or see more details.
function googleMapsUrl(restaurant) {
  const query = encodeURIComponent(restaurant.name)
  return `https://www.google.com/maps/search/?api=1&query=${query}&query_place_id=${restaurant.id}`
}

function MapPage() {
  const { t, i18n } = useTranslation()
  const { position, restaurants, error } = useNearbyRestaurants()
  const [selected, setSelected] = useState(null) // restaurant whose info window is open

  return (
    <>
      <h1>{t('map.title')}</h1>

      {error && <p role="alert">{t(error)}</p>}
      {!error && !position && <p>{t('loading')}</p>}

      {/* The map needs a center, so we wait for the user's position. */}
      {position && (
        <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
          <Map
            className="map"
            defaultCenter={position}
            defaultZoom={15}
            mapId="DEMO_MAP_ID"
            gestureHandling="greedy"
          >
            {/* Blue pin = you. */}
            <AdvancedMarker position={position} title={t('map.you')}>
              <Pin background="#1a73e8" borderColor="#0b4fa8" glyphColor="#ffffff" />
            </AdvancedMarker>

            {/* Our /api function sends { latitude, longitude }; Google Maps expects { lat, lng }. */}
            {(restaurants ?? []).map((restaurant) => (
              <AdvancedMarker
                key={restaurant.id}
                position={{ lat: restaurant.location.latitude, lng: restaurant.location.longitude }}
                title={restaurant.name}
                onClick={() => setSelected(restaurant)}
              />
            ))}

            {selected && (
              <InfoWindow
                position={{ lat: selected.location.latitude, lng: selected.location.longitude }}
                pixelOffset={[0, -40]}
                onCloseClick={() => setSelected(null)}
              >
                <strong>{selected.name}</strong>
                {selected.rating && (
                  <p>
                    ★{' '}
                    {selected.rating.toLocaleString(i18n.language, {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                    })}
                  </p>
                )}
                <p>{selected.address}</p>
                <a href={googleMapsUrl(selected)} target="_blank" rel="noreferrer">
                  {t('map.openInGoogleMaps')}
                </a>
              </InfoWindow>
            )}
          </Map>
        </APIProvider>
      )}
    </>
  )
}

export default MapPage
