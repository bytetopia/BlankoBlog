import React, { useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Paper,
  Button,
} from '@mui/material'
import {
  Article,
  LocalOffer,
  Settings,
  Dashboard,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import AdminNavbar from '../../components/AdminNavbar'

const AdminDashboardPage: React.FC = () => {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  useDocumentTitle('Admin Dashboard')

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
    }
  }, [isAuthenticated, navigate])

  if (!isAuthenticated) {
    return null
  }

  const quickActions = [
    {
      title: 'Manage Posts',
      description: 'Create, edit, and manage your blog posts',
      icon: <Article sx={{ fontSize: 40, color: 'primary.main' }} />,
      path: '/admin/posts',
      color: '#2196f3',
    },
    {
      title: 'Manage Tags',
      description: 'Organize and manage your content tags',
      icon: <LocalOffer sx={{ fontSize: 40, color: 'secondary.main' }} />,
      path: '/admin/tags',
      color: '#ff9800',
    },
    {
      title: 'Settings',
      description: 'Configure your blog settings and preferences',
      icon: <Settings sx={{ fontSize: 40, color: 'success.main' }} />,
      path: '/admin/settings',
      color: '#4caf50',
    },
  ]

  return (
    <Box>
      <AdminNavbar />
      <Box>
        {/* Welcome Section */}
        <Box sx={{ mb: 6, px: 4, pt: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            Welcome to Admin Dashboard
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Manage your blog content, tags, and settings from here
          </Typography>
        </Box>

        {/* Quick Actions Cards */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 3,
          mb: 6,
          px: 4
        }}>
          {quickActions.map((action) => (
            <Card
              key={action.title}
              sx={{
                height: '100%',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 3,
                },
              }}
              onClick={() => navigate(action.path)}
            >
              <CardContent sx={{ textAlign: 'center', p: 4 }}>
                <Box sx={{ mb: 2 }}>
                  {action.icon}
                </Box>
                <Typography variant="h5" component="h2" gutterBottom>
                  {action.title}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  {action.description}
                </Typography>
                <Button
                  variant="contained"
                  sx={{ 
                    backgroundColor: action.color,
                    '&:hover': {
                      backgroundColor: action.color,
                      opacity: 0.8,
                    },
                  }}
                >
                  Go to {action.title}
                </Button>
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* Quick Stats Section */}
        <Box sx={{ mt: 6, px: 4, pb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
            Quick Overview
          </Typography>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 2
          }}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Dashboard sx={{ fontSize: 30, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6">Dashboard</Typography>
              <Typography variant="body2" color="text.secondary">
                Your admin center
              </Typography>
            </Paper>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Article sx={{ fontSize: 30, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6">Posts</Typography>
              <Typography variant="body2" color="text.secondary">
                Manage your content
              </Typography>
            </Paper>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <LocalOffer sx={{ fontSize: 30, color: 'secondary.main', mb: 1 }} />
              <Typography variant="h6">Tags</Typography>
              <Typography variant="body2" color="text.secondary">
                Organize your posts
              </Typography>
            </Paper>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Settings sx={{ fontSize: 30, color: 'success.main', mb: 1 }} />
              <Typography variant="h6">Settings</Typography>
              <Typography variant="body2" color="text.secondary">
                Configure your blog
              </Typography>
            </Paper>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default AdminDashboardPage