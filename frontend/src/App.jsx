import { Route, Routes } from 'react-router'
import Layout from './components/Layout.jsx'
import HomePage from './pages/HomePage.jsx'
import ListsPage from './pages/ListsPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import MapPage from './pages/MapPage.jsx'

// Layout wraps every page: it draws the header and shows the current page in its <Outlet />.
function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/lists" element={<ListsPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Route>
    </Routes>
  )
}

export default App
