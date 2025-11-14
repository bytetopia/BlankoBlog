import { StrictMode, useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, useLocation } from 'react-router-dom'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { theme, createVisitorTheme } from './utils/theme'
import { AuthProvider } from './contexts/AuthContext'
import { SiteConfigProvider, useSiteConfig } from './contexts/SiteConfigContext'
import './index.css'
import App from './App.tsx'

// Dynamic theme provider that uses custom fonts for visitor pages only
function DynamicThemeProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const { fontFamily, fontUrl } = useSiteConfig()
  
  // Determine if we're on an admin page
  const isAdminRoute = location.pathname.startsWith('/admin')
  
  // Create theme based on route type
  const activeTheme = useMemo(() => {
    // Use default admin theme for admin pages
    if (isAdminRoute) {
      return theme
    }
    
    // Use visitor theme (black and gray) for visitor pages
    return createVisitorTheme(fontFamily, fontUrl)
  }, [isAdminRoute, fontFamily, fontUrl])

  return (
    <ThemeProvider theme={activeTheme}>
      {children}
    </ThemeProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <SiteConfigProvider>
        <DynamicThemeProvider>
          <CssBaseline />
          <AuthProvider>
            <App />
          </AuthProvider>
        </DynamicThemeProvider>
      </SiteConfigProvider>
    </BrowserRouter>
  </StrictMode>,
)
