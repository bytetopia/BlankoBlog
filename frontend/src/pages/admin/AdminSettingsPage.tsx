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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import { Save, Lock, Settings as SettingsIcon, Add, Edit, Delete } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useSiteConfig } from '../../hooks/useSiteConfig'
import { settingsAPI, type UpdateConfigRequest, type UpdatePasswordRequest } from '../../services/api'
import AdminNavbar from '../../components/AdminNavbar'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

interface FooterLink {
  text: string
  url: string
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
  const { refetchConfig } = useSiteConfig()
  useDocumentTitle('Settings')
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
  const [footerLinks, setFooterLinks] = useState<FooterLink[]>([])
  const [footerDialogOpen, setFooterDialogOpen] = useState(false)
  const [editingFooterIndex, setEditingFooterIndex] = useState<number | null>(null)
  const [footerFormData, setFooterFormData] = useState({ text: '', url: '' })

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
      
      // Parse footer links from config
      if (response.data.configs.footer_links) {
        try {
          const links = JSON.parse(response.data.configs.footer_links)
          setFooterLinks(links)
        } catch (e) {
          console.error('Failed to parse footer links:', e)
          setFooterLinks([
            { text: 'Home', url: '/' },
            { text: 'Tags', url: '/tags' },
            { text: 'RSS', url: '/feed' }
          ])
        }
      } else {
        setFooterLinks([
          { text: 'Home', url: '/' },
          { text: 'Tags', url: '/tags' },
          { text: 'RSS', url: '/feed' }
        ])
      }
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
          custom_css: config.custom_css || '',
          language: config.language || 'en',
        }
      }
      
      await settingsAPI.updateConfig(updateRequest)
      // Refresh the global site config cache
      await refetchConfig()
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

  const handleAddFooterLink = () => {
    setEditingFooterIndex(null)
    setFooterFormData({ text: '', url: '' })
    setFooterDialogOpen(true)
  }

  const handleEditFooterLink = (index: number) => {
    setEditingFooterIndex(index)
    setFooterFormData(footerLinks[index])
    setFooterDialogOpen(true)
  }

  const handleDeleteFooterLink = (index: number) => {
    const newLinks = footerLinks.filter((_, i) => i !== index)
    setFooterLinks(newLinks)
  }

  const handleFooterDialogClose = () => {
    setFooterDialogOpen(false)
    setFooterFormData({ text: '', url: '' })
    setEditingFooterIndex(null)
  }

  const handleFooterDialogSave = () => {
    if (!footerFormData.text || !footerFormData.url) {
      showSnackbar('Please fill in all fields', 'error')
      return
    }

    if (editingFooterIndex !== null) {
      // Edit existing link
      const newLinks = [...footerLinks]
      newLinks[editingFooterIndex] = footerFormData
      setFooterLinks(newLinks)
    } else {
      // Add new link
      setFooterLinks([...footerLinks, footerFormData])
    }
    
    handleFooterDialogClose()
  }

  const handleSaveFooterLinks = async () => {
    try {
      setConfigSaving(true)
      const updateRequest: UpdateConfigRequest = {
        configs: {
          footer_links: JSON.stringify(footerLinks)
        }
      }
      
      await settingsAPI.updateConfig(updateRequest)
      await refetchConfig()
      showSnackbar('Footer links saved successfully!', 'success')
    } catch (error) {
      console.error('Failed to save footer links:', error)
      showSnackbar('Failed to save footer links', 'error')
    } finally {
      setConfigSaving(false)
    }
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
              <Tab label="Appearance" {...a11yProps(1)} />
              <Tab label="Footer Links" {...a11yProps(2)} />
              <Tab label="User Settings" {...a11yProps(3)} />
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
                <FormControl fullWidth>
                  <InputLabel id="language-label">Visitor Page Language</InputLabel>
                  <Select
                    labelId="language-label"
                    id="language-select"
                    value={config.language || 'en'}
                    label="Visitor Page Language"
                    onChange={(e) => handleConfigChange('language', e.target.value)}
                  >
                    <MenuItem value="en">English</MenuItem>
                    <MenuItem value="zh-CN">简体中文 (Simplified Chinese)</MenuItem>
                  </Select>
                  <FormHelperText>Language for visitor-facing pages (posts, tags, comments)</FormHelperText>
                </FormControl>
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
              Appearance Settings
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
              Customize the visual appearance of your blog for visitors. Add custom CSS to override default styles.
            </Typography>

            {configLoading ? (
              <Typography>Loading...</Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={20}
                  label="Custom CSS"
                  value={config.custom_css || ''}
                  onChange={(e) => handleConfigChange('custom_css', e.target.value)}
                  helperText="Add your custom CSS here. This will be injected into visitor pages and will override default styles."
                  placeholder="/* Add your custom CSS here */&#10;body {&#10;  font-family: 'Your Font', serif;&#10;}"
                  sx={{
                    '& .MuiInputBase-root': {
                      fontFamily: 'monospace',
                      fontSize: '0.9rem',
                    }
                  }}
                />
                <Button
                  variant="contained"
                  startIcon={<Save />}
                  onClick={handleConfigSave}
                  disabled={configSaving}
                  sx={{ alignSelf: 'flex-start', mt: 2 }}
                >
                  {configSaving ? 'Saving...' : 'Save Appearance Settings'}
                </Button>
              </Box>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Typography variant="h6" gutterBottom>
              Footer Links
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
              Customize the links displayed in the footer of your blog.
            </Typography>

            {configLoading ? (
              <Typography>Loading...</Typography>
            ) : (
              <Box>
                <List>
                  {footerLinks.map((link, index) => (
                    <ListItem
                      key={index}
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        mb: 1,
                      }}
                      secondaryAction={
                        <>
                          <IconButton edge="end" aria-label="edit" onClick={() => handleEditFooterLink(index)} sx={{ mr: 1 }}>
                            <Edit />
                          </IconButton>
                          <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteFooterLink(index)}>
                            <Delete />
                          </IconButton>
                        </>
                      }
                    >
                      <ListItemText
                        primary={link.text}
                        secondary={link.url}
                      />
                    </ListItem>
                  ))}
                </List>
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={handleAddFooterLink}
                  >
                    Add Footer Link
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<Save />}
                    onClick={handleSaveFooterLinks}
                    disabled={configSaving}
                  >
                    {configSaving ? 'Saving...' : 'Save Footer Links'}
                  </Button>
                </Box>
              </Box>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
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

        <Dialog open={footerDialogOpen} onClose={handleFooterDialogClose} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingFooterIndex !== null ? 'Edit Footer Link' : 'Add Footer Link'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <TextField
                fullWidth
                label="Link Text"
                value={footerFormData.text}
                onChange={(e) => setFooterFormData({ ...footerFormData, text: e.target.value })}
                placeholder="e.g., Home, About, Contact"
                required
              />
              <TextField
                fullWidth
                label="Link URL"
                value={footerFormData.url}
                onChange={(e) => setFooterFormData({ ...footerFormData, url: e.target.value })}
                placeholder="e.g., /, /about, https://example.com"
                required
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleFooterDialogClose}>Cancel</Button>
            <Button onClick={handleFooterDialogSave} variant="contained">
              {editingFooterIndex !== null ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  )
}

export default AdminSettingsPage