import React from 'react'
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Button,
} from '@mui/material'
import { 
  Dashboard, 
  Article, 
  LocalOffer, 
  Comment,
  Settings,
  Home,
} from '@mui/icons-material'
import { useNavigate, useLocation } from 'react-router-dom'

const AdminNavbar: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  const navItems = [
    {
      label: 'Dashboard',
      path: '/admin',
      icon: <Dashboard />,
      exact: true,
    },
    {
      label: 'Posts',
      path: '/admin/posts',
      icon: <Article />,
    },
    {
      label: 'Tags',
      path: '/admin/tags',
      icon: <LocalOffer />,
    },
    {
      label: 'Comments',
      path: '/admin/comments',
      icon: <Comment />,
    },
    {
      label: 'Settings',
      path: '/admin/settings',
      icon: <Settings />,
    },
  ]

  return (
    <AppBar 
      position="static" 
      sx={{ 
        backgroundColor: 'primary.dark',
        borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
      }}
    >
      <Toolbar>
        {/* Logo/Home button */}
        <IconButton
          color="inherit"
          onClick={() => navigate('/admin')}
          edge="start"
          sx={{ mr: 2 }}
        >
          <Dashboard />
        </IconButton>
        
        <Typography
          variant="h6"
          component="div"
          sx={{ mr: 4 }}
        >
          Admin Panel
        </Typography>

        {/* Navigation items */}
        <Box sx={{ display: 'flex', gap: 1, flexGrow: 1 }}>
          {navItems.map((item) => (
            <Button
              key={item.path}
              color="inherit"
              startIcon={item.icon}
              onClick={() => navigate(item.path)}
              sx={{
                backgroundColor: isActive(item.path) && (!item.exact || location.pathname === item.path) 
                  ? 'rgba(255, 255, 255, 0.1)' 
                  : 'transparent',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              {item.label}
            </Button>
          ))}
        </Box>

        {/* Back to main site button */}
        <Button
          color="inherit"
          startIcon={<Home />}
          onClick={() => navigate('/')}
          variant="outlined"
          sx={{ 
            borderColor: 'rgba(255, 255, 255, 0.3)',
            '&:hover': {
              borderColor: 'rgba(255, 255, 255, 0.5)',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            },
          }}
        >
          Back to Site
        </Button>
      </Toolbar>
    </AppBar>
  )
}

export default AdminNavbar