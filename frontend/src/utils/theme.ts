import { createTheme } from '@mui/material/styles'
import type { Theme } from '@mui/material/styles'

// Default static theme for admin pages
export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 500,
      lineHeight: 1.4,
    },
    body1: {
      lineHeight: 1.6,
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderRadius: 8,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 6,
        },
      },
    },
  },
})

// Load Google Font dynamically
export const loadGoogleFont = (fontUrl: string): void => {
  if (!fontUrl) return

  // Check if the link already exists
  const existingLink = document.querySelector(`link[href="${fontUrl}"]`)
  if (existingLink) return

  const link = document.createElement('link')
  link.href = fontUrl
  link.rel = 'stylesheet'
  document.head.appendChild(link)
}

// Create a dynamic theme with custom font family
export const createCustomTheme = (fontFamily?: string, fontUrl?: string): Theme => {
  // Load web font if URL is provided
  if (fontUrl) {
    loadGoogleFont(fontUrl)
  }

  const customFontFamily = fontFamily 
    ? `"${fontFamily}", "Roboto", "Helvetica", "Arial", sans-serif`
    : '"Roboto", "Helvetica", "Arial", sans-serif'

  return createTheme({
    palette: {
      mode: 'light',
      primary: {
        main: '#1976d2',
        light: '#42a5f5',
        dark: '#1565c0',
      },
      secondary: {
        main: '#dc004e',
      },
      background: {
        default: '#ffffff',
        paper: '#ffffff',
      },
    },
    typography: {
      fontFamily: customFontFamily,
      h1: {
        fontSize: '2.5rem',
        fontWeight: 500,
        lineHeight: 1.2,
      },
      h2: {
        fontSize: '2rem',
        fontWeight: 500,
        lineHeight: 1.3,
      },
      h3: {
        fontSize: '1.5rem',
        fontWeight: 500,
        lineHeight: 1.4,
      },
      body1: {
        lineHeight: 1.6,
      },
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            borderRadius: 8,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 6,
          },
        },
      },
    },
  })
}