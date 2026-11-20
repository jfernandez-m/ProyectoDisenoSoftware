import { useTranslation } from 'react-i18next'
import { Link, Outlet } from 'react-router'
import { useAuth } from '../auth/AuthContext.jsx'

function Layout() {
  const { t, i18n } = useTranslation()
  const { user, logout } = useAuth()

  return (
    <div className="layout">
      <header className="header">
        <Link to="/" className="brand">{t('brand')}</Link>
        <nav className="nav">
          <Link to="/">{t('nav.home')}</Link>
          <Link to="/map">{t('nav.map')}</Link>
          <a href="#">{t('nav.lists')}</a>
          <select
            aria-label={t('language')}
            value={i18n.resolvedLanguage}
            onChange={(event) => i18n.changeLanguage(event.target.value)}
          >
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>
          {/* user is undefined while we still don't know: show nothing, so it doesn't flicker. */}
          {user && (
            <>
              <span className="muted">{user.name}</span>
              <button type="button" className="button-link" onClick={logout}>
                {t('auth.logout')}
              </button>
            </>
          )}
          {user === null && <Link to="/login">{t('auth.login')}</Link>}
        </nav>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
