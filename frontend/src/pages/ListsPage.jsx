import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate } from 'react-router'
import { apiFetch } from '../api.js'
import { useAuth } from '../auth/AuthContext.jsx'
import ListButtons from '../components/ListButtons.jsx'
import SavedRestaurantCard from '../components/SavedRestaurantCard.jsx'
import { useLists } from '../hooks/useLists.js'

// A saved row back in the same shape as /api/restaurants, so ListButtons works with it.
const toPlace = (item) => ({
  id: item.place_id,
  name: item.name,
  address: item.address,
  cuisine: item.cuisine,
  rating: item.rating,
  priceLevel: item.price_level,
  photos: item.photo ? [item.photo] : [],
})

function ListsPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const lists = useLists()
  const [links, setLinks] = useState({}) // status -> share link

  // Asks the backend for the link and copies it to the clipboard.
  async function share(status) {
    const { id } = await apiFetch('/api/share', { method: 'POST', body: JSON.stringify({ status }) })
    const link = `${window.location.origin}/share/${id}`
    setLinks((current) => ({ ...current, [status]: link }))
    navigator.clipboard?.writeText(link).catch(() => {})
  }

  if (user === null) return <Navigate to="/login" replace />
  if (!lists.items) return <p>{t('loading')}</p>

  return (
    <>
      <h1>{t('lists.title')}</h1>
      {['pending', 'visited'].map((status) => {
        const items = lists.items.filter((item) => item.status === status)
        return (
          <section key={status}>
            <h2>{t(`lists.${status}Title`)}</h2>
            {items.length > 0 && (
              <button type="button" className="button-link" onClick={() => share(status)}>
                {t('lists.share')}
              </button>
            )}
            {links[status] && (
              <p className="muted">
                {t('lists.copied')} <a href={links[status]}>{links[status]}</a>
              </p>
            )}
            {items.length === 0 && <p className="muted">{t('lists.empty')}</p>}
            <ul className="restaurant-list">
              {items.map((item) => (
                <SavedRestaurantCard key={item.place_id} item={item}>
                  <ListButtons place={toPlace(item)} lists={lists} />
                </SavedRestaurantCard>
              ))}
            </ul>
          </section>
        )
      })}
    </>
  )
}

export default ListsPage
