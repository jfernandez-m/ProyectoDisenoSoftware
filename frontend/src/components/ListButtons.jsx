import { useState } from 'react'
import { useTranslation } from 'react-i18next'

// "Want to go" / "Been there". Clicking the active one removes the restaurant from the list.
function ListButtons({ place, lists }) {
  const { t } = useTranslation()
  const [failed, setFailed] = useState(false)
  const current = lists.statusOf(place.id)

  function toggle(status) {
    setFailed(false)
    const action = current === status ? lists.remove(place.id) : lists.save(place, status)
    action.catch(() => setFailed(true))
  }

  return (
    <div className="list-buttons">
      {['pending', 'visited'].map((status) => (
        <button
          key={status}
          type="button"
          className="chip"
          aria-pressed={current === status}
          onClick={() => toggle(status)}
        >
          {t(`lists.${status}`)}
        </button>
      ))}
      {failed && <small role="alert" className="form-error">{t('errors.saveFailed')}</small>}
    </div>
  )
}

export default ListButtons
