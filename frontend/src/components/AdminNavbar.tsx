import React, { useState } from 'react'
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Button,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import { 
  Article, 
  LocalOffer, 
  Comment,
  Settings,
  Home,
  Menu as MenuIcon,
  Close as CloseIcon,
} from '@mui/icons-material'
import { useNavigate, useLocation } from 'react-router-dom'

const AdminNavbar: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  const navItems = [
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

  const handleNavigate = (path: string) => {
    navigate(path)
    setMobileMenuOpen(false)
  }

  const handleLogoClick = () => {
    navigate('/admin')
    setMobileMenuOpen(false)
  }

  return (
    <>
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
            onClick={handleLogoClick}
            edge="start"
            sx={{ mr: 2 }}
          >
            <Home />
          </IconButton>
          
          <Typography
            variant="h6"
            component="div"
            onClick={handleLogoClick}
            sx={{ 
              mr: 4,
              cursor: 'pointer',
              flexGrow: isMobile ? 1 : 0,
              '&:hover': {
                opacity: 0.8,
              },
            }}
          >
            Admin Panel
          </Typography>

          {/* Desktop Navigation items */}
          {!isMobile && (
            <>
              <Box sx={{ display: 'flex', gap: 1, flexGrow: 1 }}>
                {navItems.map((item) => (
                  <Button
                    key={item.path}
                    color="inherit"
                    startIcon={item.icon}
                    onClick={() => handleNavigate(item.path)}
                    sx={{
                      backgroundColor: isActive(item.path)
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
            </>
          )}

          {/* Mobile Menu Button */}
          {isMobile && (
            <IconButton
              color="inherit"
              onClick={() => setMobileMenuOpen(true)}
              edge="end"
            >
              <MenuIcon />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: 280,
          },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Menu</Typography>
          <IconButton onClick={() => setMobileMenuOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider />
        <List>
          {navItems.map((item) => (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                selected={isActive(item.path)}
                onClick={() => handleNavigate(item.path)}
              >
                <ListItemIcon>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Divider />
        <List>
          <ListItem disablePadding>
            <ListItemButton onClick={() => handleNavigate('/')}>
              <ListItemIcon>
                <Home />
              </ListItemIcon>
              <ListItemText primary="Back to Site" />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>
    </>
  )
}

export default AdminNavbar