import { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import { CircularProgress, Box } from '@mui/material'
import LoginPage from './pages/LoginPage'

// Lazy load all admin functionality as a single chunk
const AdminRoutes = lazy(() => import('./components/AdminRoutes'))

// Loading component for lazy-loaded admin pages
const AdminLoadingFallback = () => (
  <Box 
    display="flex" 
    justifyContent="center" 
    alignItems="center" 
    minHeight="100vh"
  >
    <CircularProgress size={40} />
  </Box>
)

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route 
        path="/*" 
        element={
          <Suspense fallback={<AdminLoadingFallback />}>
            <AdminRoutes />
          </Suspense>
        } 
      />
    </Routes>
  )
}

export default App
