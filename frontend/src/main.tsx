import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { theme } from './utils/theme'
import { AuthProvider } from './contexts/AuthContext'
import { SiteConfigProvider } from './contexts/SiteConfigContext'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename="/admin">
      <SiteConfigProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <AuthProvider>
            <App />
          </AuthProvider>
        </ThemeProvider>
      </SiteConfigProvider>
    </BrowserRouter>
  </StrictMode>,
)
