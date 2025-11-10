import React, { useState } from 'react'
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
} from '@mui/material'
import { Home, Login, AdminPanelSettings, Settings, Logout, AccountCircle } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Navbar: React.FC = () => {
  const navigate = useNavigate()
  const { isAuthenticated, logout } = useAuth()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = () => {
    logout()
    navigate('/')
    handleClose()
  }

  const handleSettings = () => {
    navigate('/settings')
    handleClose()
  }

  return (
    <AppBar position="static">
      <Toolbar>
        <IconButton
          color="inherit"
          onClick={() => navigate('/')}
          edge="start"
        >
          <Home />
        </IconButton>
        <Typography
          variant="h6"
          component="div"
          sx={{ flexGrow: 1, ml: 2, cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          Blanko Blog
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          {isAuthenticated ? (
            <>
              <Button
                color="inherit"
                startIcon={<AdminPanelSettings />}
                onClick={() => navigate('/admin')}
              >
                Admin
              </Button>
              <div>
                <IconButton
                  color="inherit"
                  onClick={handleMenu}
                  sx={{ p: 0, ml: 1 }}
                >
                  <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>
                    <AccountCircle />
                  </Avatar>
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={open}
                  onClose={handleClose}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                >
                  <MenuItem onClick={handleSettings}>
                    <Settings sx={{ mr: 1 }} />
                    Settings
                  </MenuItem>
                  <MenuItem onClick={handleLogout}>
                    <Logout sx={{ mr: 1 }} />
                    Logout
                  </MenuItem>
                </Menu>
              </div>
            </>
          ) : (
            <Button
              color="inherit"
              startIcon={<Login />}
              onClick={() => navigate('/login')}
            >
              Login
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default Navbar