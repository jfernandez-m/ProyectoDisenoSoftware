// Card for a restaurant saved in a list. children = extra content, like the list buttons.
function SavedRestaurantCard({ item, children }) {
  return (
    <li className="card">
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
        {children}
      </div>
    </li>
  )
}

export default SavedRestaurantCard
