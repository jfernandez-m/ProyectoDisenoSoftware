import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import GoogleButton from './GoogleButton.jsx'

function Layout({ children }) {
  const { t, i18n } = useTranslation()
  // undefined = still asking, null = not logged in, object = logged in.
  const [user, setUser] = useState(undefined)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((response) => (response.ok ? response.json() : null))
      .then(setUser)
      .catch(() => setUser(null))
  }, [])

  return (
    <div className="layout">
      <header className="header">
        <span className="brand">{t('brand')}</span>
        <nav className="nav">
          <a href="#">{t('nav.home')}</a>
          <a href="#">{t('nav.map')}</a>
          <a href="#">{t('nav.lists')}</a>
          <select
            aria-label={t('language')}
            value={i18n.resolvedLanguage}
            onChange={(event) => i18n.changeLanguage(event.target.value)}
          >
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>
          {user && <span className="muted">{user.name}</span>}
          {user === null && <GoogleButton />}
        </nav>
      </header>
      <main className="main">{children}</main>
    </div>
  )
}

export default Layout
