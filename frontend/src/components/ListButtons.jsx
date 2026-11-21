import { useTranslation } from 'react-i18next'

// "Want to go" / "Been there". Clicking the active one removes the restaurant from the list.
function ListButtons({ place, lists }) {
  const { t } = useTranslation()
  const current = lists.statusOf(place.id)
  const toggle = (status) =>
    current === status ? lists.remove(place.id) : lists.save(place, status)

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
    </div>
  )
}

export default ListButtons
