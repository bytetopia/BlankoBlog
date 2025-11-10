import React, { useState, useEffect } from 'react'
import {
  Paper,
  Typography,
  Tabs,
  Tab,
  Box,
  TextField,
  Button,
  Alert,
  Snackbar,
} from '@mui/material'
import { Save, Lock, Settings as SettingsIcon } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { settingsAPI, type UpdateConfigRequest, type UpdatePasswordRequest } from '../../services/api'
import AdminNavbar from '../../components/AdminNavbar'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  )
}

function a11yProps(index: number) {
  return {
    id: `settings-tab-${index}`,
    'aria-controls': `settings-tabpanel-${index}`,
  }
}

const AdminSettingsPage: React.FC = () => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [tabValue, setTabValue] = useState(0)
  const [config, setConfig] = useState<Record<string, string>>({})
  const [configLoading, setConfigLoading] = useState(true)
  const [configSaving, setConfigSaving] = useState(false)
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  })

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
    }
  }, [isAuthenticated, navigate])

  // Load config on component mount
  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      setConfigLoading(true)
      const response = await settingsAPI.getConfig()
      setConfig(response.data.configs)
    } catch (error) {
      console.error('Failed to load config:', error)
      showSnackbar('Failed to load settings', 'error')
    } finally {
      setConfigLoading(false)
    }
  }

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity })
  }

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const handleConfigChange = (key: string, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }))
  }

  const handleConfigSave = async () => {
    try {
      setConfigSaving(true)
      const updateRequest: UpdateConfigRequest = {
        configs: {
          blog_name: config.blog_name || '',
          blog_description: config.blog_description || '',
          blog_introduction: config.blog_introduction || '',
        }
      }
      
      await settingsAPI.updateConfig(updateRequest)
      showSnackbar('Blog settings saved successfully!', 'success')
    } catch (error) {
      console.error('Failed to save config:', error)
      showSnackbar('Failed to save settings', 'error')
    } finally {
      setConfigSaving(false)
    }
  }

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }))
  }

  const handlePasswordSave = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      showSnackbar('New password and confirmation do not match', 'error')
      return
    }

    if (passwordData.new_password.length < 6) {
      showSnackbar('New password must be at least 6 characters long', 'error')
      return
    }

    try {
      setPasswordSaving(true)
      const updateRequest: UpdatePasswordRequest = {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      }
      
      await settingsAPI.updatePassword(updateRequest)
      showSnackbar('Password updated successfully!', 'success')
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      })
    } catch (error: any) {
      console.error('Failed to update password:', error)
      const errorMessage = error.response?.data?.error || 'Failed to update password'
      showSnackbar(errorMessage, 'error')
    } finally {
      setPasswordSaving(false)
    }
  }

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }))
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <Box>
      <AdminNavbar />
      <Box sx={{ px: 4, py: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SettingsIcon />
            Settings
          </Typography>

          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="settings tabs">
              <Tab label="Blog Settings" {...a11yProps(0)} />
              <Tab label="User Settings" {...a11yProps(1)} />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <Typography variant="h6" gutterBottom>
              Blog Configuration
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
              Customize your blog's appearance and content.
            </Typography>

            {configLoading ? (
              <Typography>Loading...</Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  fullWidth
                  label="Blog Name"
                  value={config.blog_name || ''}
                  onChange={(e) => handleConfigChange('blog_name', e.target.value)}
                  helperText="The name of your blog displayed in the header"
                />
                <TextField
                  fullWidth
                  label="Blog Description"
                  value={config.blog_description || ''}
                  onChange={(e) => handleConfigChange('blog_description', e.target.value)}
                  helperText="A brief description of your blog"
                />
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Blog Introduction"
                  value={config.blog_introduction || ''}
                  onChange={(e) => handleConfigChange('blog_introduction', e.target.value)}
                  helperText="An introduction text displayed on the homepage"
                />
                <Button
                  variant="contained"
                  startIcon={<Save />}
                  onClick={handleConfigSave}
                  disabled={configSaving}
                  sx={{ alignSelf: 'flex-start', mt: 2 }}
                >
                  {configSaving ? 'Saving...' : 'Save Blog Settings'}
                </Button>
              </Box>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Typography variant="h6" gutterBottom>
              Password Settings
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
              Change your account password.
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                fullWidth
                type="password"
                label="Current Password"
                value={passwordData.current_password}
                onChange={(e) => handlePasswordChange('current_password', e.target.value)}
                required
              />
              <TextField
                fullWidth
                type="password"
                label="New Password"
                value={passwordData.new_password}
                onChange={(e) => handlePasswordChange('new_password', e.target.value)}
                helperText="Password must be at least 6 characters long"
                required
              />
              <TextField
                fullWidth
                type="password"
                label="Confirm New Password"
                value={passwordData.confirm_password}
                onChange={(e) => handlePasswordChange('confirm_password', e.target.value)}
                required
              />
              <Button
                variant="contained"
                startIcon={<Lock />}
                onClick={handlePasswordSave}
                disabled={passwordSaving || !passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password}
                sx={{ alignSelf: 'flex-start', mt: 2 }}
              >
                {passwordSaving ? 'Updating...' : 'Update Password'}
              </Button>
            </Box>
          </TabPanel>
        </Paper>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  )
}

export default AdminSettingsPage