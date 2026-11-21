import { useTranslation } from 'react-i18next'

// Google's AI summary ("what people say most") and the reviews it comes from.
function Reviews({ summary, reviews }) {
  const { t } = useTranslation()

  return (
    <>
      {summary && (
        <div className="review-summary">
          <strong>{t('googleReviews.summary')}</strong>
          <p>{summary.text}</p>
          {/* Google requires saying the summary was written by Gemini. */}
          <small className="muted">{summary.disclosure}</small>
        </div>
      )}
      {reviews.length === 0 && <p className="muted">{t('googleReviews.none')}</p>}
      <ul className="review-list">
        {reviews.map((review) => (
          <li key={review.id}>
            <span className="review-head">
              {/* Google also requires showing who wrote each review, with a link to their profile. */}
              <a href={review.authorUri} target="_blank" rel="noreferrer">
                {review.author}
              </a>
              <span
                className="review-stars"
                aria-label={t('googleReviews.stars', { count: review.rating })}
              >
                {'★'.repeat(review.rating)}
              </span>
              <span className="muted">{review.time}</span>
            </span>
            <p>{review.text}</p>
          </li>
        ))}
      </ul>
    </>
  )
}

export default Reviews
