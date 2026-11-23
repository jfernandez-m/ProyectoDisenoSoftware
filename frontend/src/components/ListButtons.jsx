import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

// "Want to go" / "Been there". Clicking the active one removes the restaurant from the list.
function ListButtons({ place, lists }) {
  const { t } = useTranslation()
  const [failed, setFailed] = useState(false)
  const [message, setMessage] = useState('') // shown for a moment after saving
  const timer = useRef(null)
  const current = lists.statusOf(place.id)

  async function toggle(status) {
    const removing = current === status
    setFailed(false)
    setMessage(removing ? t('lists.removed') : t('lists.added', { list: t(`lists.${status}`) }))
    // A new click restarts the timer, so the message never disappears too early.
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setMessage(''), 2500)
    try {
      await (removing ? lists.remove(place.id) : lists.save(place, status))
    } catch {
      setMessage('')
      setFailed(true)
    }
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
          {current === status && '✓ '}
          {t(`lists.${status}`)}
        </button>
      ))}
      {/* role="status": screen readers also announce the message. */}
      {message && <small role="status" className="list-feedback">{message}</small>}
      {failed && <small role="alert" className="form-error">{t('errors.saveFailed')}</small>}
    </div>
  )
}

export default ListButtons
