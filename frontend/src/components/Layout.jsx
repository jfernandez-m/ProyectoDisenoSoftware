import { useTranslation } from 'react-i18next'

function Layout({ children }) {
  const { t, i18n } = useTranslation()

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
        </nav>
      </header>
      <main className="main">{children}</main>
    </div>
  )
}

export default Layout
