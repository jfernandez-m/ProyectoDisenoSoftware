import { useTranslation } from 'react-i18next'
import { Navigate } from 'react-router'
import { useAuth } from '../auth/AuthContext.jsx'
import ListButtons from '../components/ListButtons.jsx'
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
            {items.length === 0 && <p className="muted">{t('lists.empty')}</p>}
            <ul className="restaurant-list">
              {items.map((item) => (
                <li key={item.place_id} className="card">
                  {item.photo ? (
                    <img
                      className="card-photo"
                      src={`/api/photo?name=${encodeURIComponent(item.photo)}`}
                      alt=""
                      loading="lazy"
                    />
                  ) : (
                    <div className="card-photo" />
                  )}
                  <div className="card-body">
                    <strong className="card-name">{item.name}</strong>
                    <span className="muted">{item.address}</span>
                    <ListButtons place={toPlace(item)} lists={lists} />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </>
  )
}

export default ListsPage
