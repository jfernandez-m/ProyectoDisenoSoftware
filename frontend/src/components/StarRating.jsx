import { useState } from 'react'
import { useTranslation } from 'react-i18next'

// "Your rating": five clickable stars. Clicking the current rating removes it.
function StarRating({ place, ratings }) {
  const { t } = useTranslation()
  const [failed, setFailed] = useState(false)
  const [hover, setHover] = useState(0) // star under the mouse, 0 = none
  const current = ratings.starsOf(place.id) ?? 0

  function choose(stars) {
    setFailed(false)
    setHover(0) // show the chosen rating solid right away, even with the mouse still on it
    const action = stars === current ? ratings.unrate(place.id) : ratings.rate(place, stars)
    action.catch(() => setFailed(true))
  }

  return (
    // previewing: the mouse is over the stars, so they show the hover instead of the saved rating.
    <div className={hover ? 'my-rating previewing' : 'my-rating'} onPointerLeave={() => setHover(0)}>
      <span className="muted">{t('ratings.yours')}</span>
      {[1, 2, 3, 4, 5].map((stars) => (
        <button
          key={stars}
          type="button"
          className={stars <= hover ? 'star-button preview' : 'star-button'}
          aria-label={t('ratings.rate', { count: stars })}
          aria-pressed={stars <= current}
          // Only with a mouse: on phones a tap would leave the preview stuck.
          onPointerEnter={(event) => event.pointerType === 'mouse' && setHover(stars)}
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
