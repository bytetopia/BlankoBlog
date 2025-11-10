import { Routes, Route, useLocation } from 'react-router-dom'
import { Container } from '@mui/material'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import PostPage from './pages/PostPage'
import LoginPage from './pages/LoginPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminPostsPage from './pages/admin/AdminPostsPage'
import AdminTagsPage from './pages/admin/AdminTagsPage'
import AdminSettingsPage from './pages/admin/AdminSettingsPage'
import AdminPostEditorPage from './pages/admin/AdminPostEditorPage'

function App() {
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin')

  return (
    <>
      {/* Only show regular navbar on non-admin pages */}
      {!isAdminRoute && <Navbar />}
      {isAdminRoute ? (
        // Admin routes without container padding for full-screen layout
        <Routes>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/posts" element={<AdminPostsPage />} />
          <Route path="/admin/posts/new" element={<AdminPostEditorPage />} />
          <Route path="/admin/posts/:id" element={<AdminPostEditorPage />} />
          <Route path="/admin/tags" element={<AdminTagsPage />} />
          <Route path="/admin/settings" element={<AdminSettingsPage />} />
        </Routes>
      ) : (
        // Non-admin routes with container padding
        <Container maxWidth="xl" sx={{ px: 2, py: 1 }}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/posts/:slug" element={<PostPage />} />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </Container>
      )}
    </>
  )
}

export default App
