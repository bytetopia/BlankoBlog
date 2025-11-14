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
const loadGoogleFont = (fontUrl: string): void => {
  if (!fontUrl) return

  // Check if the link already exists
  const existingLink = document.querySelector(`link[href="${fontUrl}"]`)
  if (existingLink) return

  const link = document.createElement('link')
  link.href = fontUrl
  link.rel = 'stylesheet'
  document.head.appendChild(link)
}

// Create a visitor theme with custom font family (minimalist black and gray theme)
export const createVisitorTheme = (fontFamily?: string, fontUrl?: string): Theme => {
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
        main: '#222222',      // Dark gray for primary text
        light: '#555555',     // Medium gray for hover states
        dark: '#000000',      // Pure black
      },
      secondary: {
        main: '#666666',      // Light gray for secondary elements
        light: '#999999',     // Lighter gray
        dark: '#444444',      // Darker gray
      },
      text: {
        primary: '#222222',   // Dark gray for primary text
        secondary: '#666666', // Medium gray for secondary text
      },
      background: {
        default: '#ffffff',
        paper: '#ffffff',
      },
      action: {
        hover: '#f5f5f5',     // Very light gray for hover
        selected: '#eeeeee',  // Light gray for selected
      },
      divider: '#e0e0e0',     // Light gray for dividers
    },
    typography: {
      fontFamily: customFontFamily,
      h1: {
        fontSize: '2.5rem',
        fontWeight: 700,
        lineHeight: 1.2,
        color: '#222222',
      },
      h2: {
        fontSize: '2rem',
        fontWeight: 700,
        lineHeight: 1.3,
        color: '#222222',
      },
      h3: {
        fontSize: '1.5rem',
        fontWeight: 600,
        lineHeight: 1.4,
        color: '#222222',
      },
      h6: {
        fontWeight: 500,
        color: '#222222',
      },
      body1: {
        lineHeight: 1.6,
        color: '#222222',
      },
      body2: {
        color: '#666666',
      },
    },
    components: {
      MuiLink: {
        styleOverrides: {
          root: {
            color: '#222222',
            '&:hover': {
              color: '#555555',
            },
          },
        },
      },
      MuiPagination: {
        styleOverrides: {
          root: {
            '& .MuiPaginationItem-root': {
              color: '#222222',
              '&:hover': {
                backgroundColor: '#f5f5f5',
              },
              '&.Mui-selected': {
                backgroundColor: '#222222',
                color: '#ffffff',
                '&:hover': {
                  backgroundColor: '#444444',
                },
              },
            },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            color: '#222222',
            '&:hover': {
              backgroundColor: '#f5f5f5',
            },
          },
        },
      },
    },
  })
}
