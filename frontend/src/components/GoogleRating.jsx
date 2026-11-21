import { useTranslation } from 'react-i18next'

// Google's rating: painted stars, the number and how many reviews it comes from.
function GoogleRating({ rating, count }) {
  const { t, i18n } = useTranslation()

  if (!rating) return <span className="muted">{t('noRating')}</span>

  return (
    <span className="rating">
      {/* --rating tells the CSS how much of the five stars to paint. */}
      <span className="stars" style={{ '--rating': rating }} aria-hidden="true">
        ★★★★★
      </span>
      {/* toLocaleString uses Intl: "4,5" in Spanish, "4.5" in English. */}
      <strong>
        {rating.toLocaleString(i18n.language, {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        })}
      </strong>
      <span className="muted">({t('reviews', { count })})</span>
    </span>
  )
}

export default GoogleRating
