import { Route, Routes } from 'react-router'
import Layout from './components/Layout.jsx'
import HomePage from './pages/HomePage.jsx'
import LoginPage from './pages/LoginPage.jsx'

// Layout wraps every page: it draws the header and shows the current page in its <Outlet />.
function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
      </Route>
    </Routes>
  )
}

export default App
