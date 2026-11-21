import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router'
import SavedRestaurantCard from '../components/SavedRestaurantCard.jsx'

// Public page: anyone with the link sees the list, without logging in.
function SharedListPage() {
  const { t } = useTranslation()
  const { id } = useParams() // the <id> in /share/<id>
  const [list, setList] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch(`/api/share?id=${encodeURIComponent(id)}`)
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then(setList)
      .catch(() => setError(true))
  }, [id])

  if (error) return <p role="alert">{t('share.notFound')}</p>
  if (!list) return <p>{t('loading')}</p>

  return (
    <>
      <h1>{t('share.title', { list: t(`lists.${list.status}Title`), name: list.ownerName })}</h1>
      {list.items.length === 0 && <p className="muted">{t('lists.empty')}</p>}
      <ul className="restaurant-list">
        {list.items.map((item) => (
          <SavedRestaurantCard key={item.place_id} item={item} />
        ))}
      </ul>
    </>
  )
}

export default SharedListPage
