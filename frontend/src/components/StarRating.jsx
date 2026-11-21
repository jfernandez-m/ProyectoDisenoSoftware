import { useState } from 'react'
import { useTranslation } from 'react-i18next'

// "Your rating": five clickable stars. Clicking the current rating removes it.
function StarRating({ place, ratings }) {
  const { t } = useTranslation()
  const [failed, setFailed] = useState(false)
  const current = ratings.starsOf(place.id) ?? 0

  function choose(stars) {
    setFailed(false)
    const action = stars === current ? ratings.unrate(place.id) : ratings.rate(place, stars)
    action.catch(() => setFailed(true))
  }

  return (
    <div className="my-rating">
      <span className="muted">{t('ratings.yours')}</span>
      {[1, 2, 3, 4, 5].map((stars) => (
        <button
          key={stars}
          type="button"
          className="star-button"
          aria-label={t('ratings.rate', { count: stars })}
          aria-pressed={stars <= current}
          onClick={() => choose(stars)}
        >
          ★
        </button>
      ))}
      {failed && <small role="alert" className="form-error">{t('errors.saveFailed')}</small>}
    </div>
  )
}

export default StarRating
