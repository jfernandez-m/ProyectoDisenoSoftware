function Layout({ children }) {
  return (
    <div className="layout">
      <header className="header">
        <span className="brand">Restaurant Recommender</span>
        <nav className="nav">
          <a href="#">Home</a>
          <a href="#">Map</a>
          <a href="#">Lists</a>
        </nav>
      </header>
      <main className="main">{children}</main>
      <footer className="footer">TICS316 · 2026</footer>
    </div>
  )
}

export default Layout
