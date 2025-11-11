import { Suspense, lazy } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { Container, CircularProgress, Box } from '@mui/material'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import PostPage from './pages/PostPage'
import TagsPage from './pages/TagsPage'
import TagPostsPage from './pages/TagPostsPage'
import LoginPage from './pages/LoginPage'

// Lazy load all admin functionality as a single chunk
const AdminRoutes = lazy(() => import('./components/AdminRoutes'))

// Loading component for lazy-loaded admin pages
const AdminLoadingFallback = () => (
  <Box 
    display="flex" 
    justifyContent="center" 
    alignItems="center" 
    minHeight="60vh"
  >
    <CircularProgress size={40} />
  </Box>
)

function App() {
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin')
  const isLoginRoute = location.pathname === '/login'

  return (
    <>
      {/* Only show navbar on login page */}
      {isLoginRoute && <Navbar />}
      {isAdminRoute ? (
        // Admin routes without container padding for full-screen layout
        // Wrap with Suspense to handle lazy loading
        <Suspense fallback={<AdminLoadingFallback />}>
          <AdminRoutes />
        </Suspense>
      ) : (
        // Non-admin routes with container padding
        <Container maxWidth="xl" sx={{ px: 2, py: 1 }}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/posts/:slug" element={<PostPage />} />
            <Route path="/tags" element={<TagsPage />} />
            <Route path="/tags/:tagId/posts" element={<TagPostsPage />} />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </Container>
      )}
    </>
  )
}

export default App
