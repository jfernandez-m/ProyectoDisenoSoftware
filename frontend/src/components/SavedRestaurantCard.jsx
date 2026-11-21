import { Link } from 'react-router'

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
        <Link to={`/restaurant/${item.place_id}`} className="card-name">
          {item.name}
        </Link>
        <span className="muted">{item.address}</span>
        {children}
      </div>
    </li>
  )
}

export default SavedRestaurantCard
