import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Box,
  Typography,
  Button,
  TextField,
  FormControlLabel,
  Switch,
  CircularProgress,
  Alert,
  IconButton,
  Divider,
  Chip,
  Tabs,
  Tab,
} from '@mui/material'
import { ArrowBack, Save, CloudDone, CloudQueue } from '@mui/icons-material'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useSiteConfig } from '../../hooks/useSiteConfig'
import { postsAPI } from '../../services/api'
import type { CreatePostRequest, UpdatePostRequest, Tag } from '../../services/api'
import TagInput from '../../components/TagInput'
import PostFileUploader from '../../components/PostFileUploader'
import MDEditor from '@uiw/react-md-editor'
import '@uiw/react-md-editor/markdown-editor.css'
import AdminNavbar from '../../components/AdminNavbar'

const AUTO_SAVE_DELAY = 60000 // 1 minute

// Helper function to convert UTC ISO string to browser's local datetime-local format (YYYY-MM-DDTHH:mm)
// This allows the admin to edit in their own timezone
const utcToLocalDatetime = (utcISOString: string): string => {
  if (!utcISOString) return ''
  
  try {
    const date = new Date(utcISOString)
    // Convert to local datetime-local format
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    
    return `${year}-${month}-${day}T${hours}:${minutes}`
  } catch (e) {
    console.error('Error converting UTC to local datetime:', e)
    return ''
  }
}

// Helper function to convert browser's local datetime-local to UTC ISO string
// The datetime from the input is in the user's browser timezone
const localDatetimeToUTC = (localDateTimeString: string): string => {
  if (!localDateTimeString) return ''
  
  try {
    // The datetime-local input gives us a string in the user's local timezone
    // JavaScript's Date constructor will interpret this as local time
    const localDate = new Date(localDateTimeString)
    
    return localDate.toISOString()
  } catch (e) {
    console.error('Error converting local datetime to UTC:', e)
    return new Date(localDateTimeString).toISOString()
  }
}

const PostEditorPage: React.FC = () => {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { timezone } = useSiteConfig()
  
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [autoSaving, setAutoSaving] = useState(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const [rightPanelTab, setRightPanelTab] = useState(0)
  const [postId, setPostId] = useState<number | null>(id && id !== 'new' ? parseInt(id) : null)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [attachmentCount, setAttachmentCount] = useState(0)
  const [post, setPost] = useState({
    title: '',
    content: '',
    summary: '',
    slug: '',
    published: false,
    tags: [] as Tag[],
    created_at: '',
  })

  const autoSaveIntervalRef = useRef<number | null>(null)
  const initialPostRef = useRef<string>('')

  const isEditing = Boolean(postId)
  const pageTitle = isEditing ? 'Edit Post' : 'Create New Post'
  useDocumentTitle(pageTitle)

  // Function to generate slug from title
  const generateSlugFromTitle = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-+|-+$/g, '') // Trim hyphens from start and end
      .substring(0, 100) // Limit length
  }

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
    }
  }, [isAuthenticated, navigate])

  // Load post data if editing
  useEffect(() => {
    const loadPost = async () => {
      if (isEditing && postId) {
        try {
          setLoading(true)
          const response = await postsAPI.getAdminPost(postId)
          const postData = response.data
          
          // Convert created_at from UTC to browser's local timezone for editing
          const createdAtLocal = utcToLocalDatetime(postData.created_at)
          
          const loadedPost = {
            title: postData.title,
            content: postData.content,
            summary: postData.summary,
            slug: postData.slug,
            published: postData.published,
            tags: postData.tags || [],
            created_at: createdAtLocal,
          }
          setPost(loadedPost)
          // Store initial state for comparison
          initialPostRef.current = JSON.stringify(loadedPost)
        } catch (err) {
          console.error('Error loading post:', err)
          setError('Failed to load post')
        } finally {
          setLoading(false)
        }
      }
    }

    if (isAuthenticated) {
      loadPost()
    }
  }, [isAuthenticated, isEditing, postId])

  // Check if post has changes from initial state
  const hasChanges = useCallback(() => {
    const currentPost = JSON.stringify(post)
    return currentPost !== initialPostRef.current
  }, [post])

  // Auto-save function (silent)
  const performAutoSave = useCallback(async () => {
    // Don't auto-save if title or content is empty
    if (!post.title.trim() || !post.content.trim()) {
      return
    }

    // Don't auto-save if no changes
    if (!hasChanges()) {
      return
    }

    try {
      setAutoSaving(true)

      // Convert datetime-local format (in browser's local timezone) to UTC ISO 8601 for backend
      let createdAtForBackend = post.created_at ? localDatetimeToUTC(post.created_at) : undefined

      if (postId) {
        // Update existing post
        const updateData: UpdatePostRequest = {
          title: post.title,
          content: post.content,
          summary: post.summary,
          slug: post.slug || undefined,
          published: post.published,
          tag_ids: post.tags.map(tag => tag.id),
          created_at: createdAtForBackend,
        }
        await postsAPI.updatePost(postId, updateData)
      } else {
        // Create new post
        const createData: CreatePostRequest = {
          title: post.title,
          content: post.content,
          summary: post.summary,
          slug: post.slug || undefined,
          published: post.published,
          tag_ids: post.tags.map(tag => tag.id),
          created_at: createdAtForBackend,
        }
        const response = await postsAPI.createPost(createData)
        
        // Update post ID and URL silently without reloading
        if (response.data?.id) {
          setPostId(response.data.id)
          navigate(`/posts/${response.data.id}`, { replace: true })
        }
      }

      // Update saved state
      initialPostRef.current = JSON.stringify(post)
      setLastSavedAt(new Date())
    } catch (err) {
      console.error('Auto-save failed:', err)
      // Don't show error for auto-save to avoid disruption
    } finally {
      setAutoSaving(false)
    }
  }, [post, postId, navigate, hasChanges])

  // Set up auto-save interval that runs at fixed interval.
  useEffect(() => {
    // Start interval
    autoSaveIntervalRef.current = setInterval(() => {
      performAutoSave()
    }, AUTO_SAVE_DELAY)

    // Cleanup on unmount
    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current)
      }
    }
  }, [performAutoSave])

  // Manual save function (with user feedback)
  const handleSave = async () => {
    try {
      setSaving(true)
      setError('')
      setSuccess('')

      // Convert datetime-local format (in browser's local timezone) to UTC ISO 8601 for backend
      let createdAtForBackend = post.created_at ? localDatetimeToUTC(post.created_at) : undefined

      if (postId) {
        // Update existing post
        const updateData: UpdatePostRequest = {
          title: post.title,
          content: post.content,
          summary: post.summary,
          slug: post.slug || undefined,
          published: post.published,
          tag_ids: post.tags.map(tag => tag.id),
          created_at: createdAtForBackend,
        }
        await postsAPI.updatePost(postId, updateData)
        setSuccess('Post updated successfully!')
        initialPostRef.current = JSON.stringify(post)
        setLastSavedAt(new Date())
      } else {
        // Create new post
        const createData: CreatePostRequest = {
          title: post.title,
          content: post.content,
          summary: post.summary,
          slug: post.slug || undefined,
          published: post.published,
          tag_ids: post.tags.map(tag => tag.id),
          created_at: createdAtForBackend,
        }
        const response = await postsAPI.createPost(createData)
        setSuccess('Post created successfully!')
        
        // Navigate to edit mode for the newly created post (manual save)
        if (response.data?.id) {
          setPostId(response.data.id)
          initialPostRef.current = JSON.stringify(post)
          setLastSavedAt(new Date())
          navigate(`/posts/${response.data.id}`, { replace: true })
        }
      }
    } catch (err) {
      console.error('Error saving post:', err)
      setError('Failed to save post')
    } finally {
      setSaving(false)
    }
  }

  const handleBack = () => {
    navigate('/posts')
  }

  const handleFieldChange = (field: string, value: string | boolean | Tag[]) => {
    if (field === 'title' && typeof value === 'string') {
      // Auto-generate slug when title changes (only for new posts or if slug is empty)
      const autoGeneratedSlug = generateSlugFromTitle(value)
      setPost(prev => ({ 
        ...prev, 
        [field]: value,
        // Only auto-generate slug if it's a new post or if current slug matches the old title's generated slug
        slug: (!isEditing || prev.slug === '' || prev.slug === generateSlugFromTitle(prev.title)) 
          ? autoGeneratedSlug 
          : prev.slug
      }))
    } else {
      setPost(prev => ({ ...prev, [field]: value }))
    }
  }

  const handleGenerateSlug = () => {
    const autoSlug = generateSlugFromTitle(post.title)
    setPost(prev => ({ ...prev, slug: autoSlug }))
  }

  if (!isAuthenticated) {
    return null
  }

  if (loading) {
    return (
      <Box>
        <AdminNavbar />
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Box>
    )
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AdminNavbar />

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Page header */}
        <Box sx={{ px: 3, py: 2, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton onClick={handleBack}>
                <ArrowBack />
              </IconButton>
              <Typography variant="h5" component="h1">
                {pageTitle}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {/* Auto-save indicator */}
              {autoSaving && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                  <CloudQueue fontSize="small" />
                  <Typography variant="body2">Saving...</Typography>
                </Box>
              )}
              {!autoSaving && lastSavedAt && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'success.main' }}>
                  <CloudDone fontSize="small" />
                  <Typography variant="body2">
                    Saved {lastSavedAt.toLocaleTimeString()}
                  </Typography>
                </Box>
              )}
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleSave}
                disabled={saving || !post.title.trim() || !post.content.trim()}
                size="large"
              >
                {saving ? 'Saving...' : (isEditing ? 'Update' : 'Create')}
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Alerts */}
        {(error || success) && (
          <Box sx={{ px: 3, pt: 2 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 1 }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" sx={{ mb: 1 }} onClose={() => setSuccess('')}>
                {success}
              </Alert>
            )}
          </Box>
        )}

        {/* Split Layout: Editor (Left) + Metadata (Right) */}
        <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Left Panel - Editor (75%) */}
          <Box sx={{ flex: '0 0 70%', display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
              {/* Title */}
              <TextField
                fullWidth
                label="Post Title"
                value={post.title}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                placeholder="Enter your post title..."
                variant="outlined"
                sx={{ mb: 3 }}
                autoFocus
              />
              
              {/* Content Editor */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                  Content (Markdown)
                </Typography>
                <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
                  <MDEditor
                    value={post.content}
                    onChange={(value) => handleFieldChange('content', value || '')}
                    preview="edit"
                    height={600}
                    data-color-mode="light"
                  />
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Right Panel - Metadata (30%) */}
          <Box sx={{ flex: '0 0 30%', display: 'flex', flexDirection: 'column', overflow: 'hidden', bgcolor: 'grey.50' }}>
            {/* Tabs Header */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
              <Tabs 
                value={rightPanelTab} 
                onChange={(_, newValue) => setRightPanelTab(newValue)}
                variant="fullWidth"
              >
                <Tab label="Metadata" />
                <Tab 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      Attachments
                      {attachmentCount > 0 && (
                        <Chip 
                          label={attachmentCount} 
                          size="small" 
                          color="primary"
                          variant="outlined"
                          sx={{ height: 20, fontSize: '0.75rem' }}
                        />
                      )}
                    </Box>
                  } 
                />
              </Tabs>
            </Box>

            {/* Tab Content */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 2, pb: 10 }}>
              {/* Metadata Tab */}
              {rightPanelTab === 0 && (
                <Box>
                  {/* Publish Status */}
                  <Box sx={{ mb: 2, p: 1.5, bgcolor: 'background.paper', borderRadius: 1 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                      Status
                    </Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={post.published}
                          onChange={(e) => handleFieldChange('published', e.target.checked)}
                          color="primary"
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2">
                            {post.published ? 'Published' : 'Draft'}
                          </Typography>
                          <Chip 
                            label={post.published ? 'Live' : 'Draft'} 
                            size="small" 
                            color={post.published ? 'success' : 'default'}
                          />
                        </Box>
                      }
                    />
                  </Box>

                  <Divider sx={{ my: 1.5 }} />

                  {/* URL Slug */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                      URL Slug
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      value={post.slug}
                      onChange={(e) => handleFieldChange('slug', e.target.value)}
                      placeholder="auto-generated-slug"
                      variant="outlined"
                      helperText={post.slug ? `/posts/${post.slug}` : 'Auto-generated from title'}
                    />
                    <Button
                      size="small"
                      onClick={handleGenerateSlug}
                      disabled={!post.title.trim()}
                      sx={{ mt: 1 }}
                      fullWidth
                      variant="outlined"
                    >
                      Generate from Title
                    </Button>
                  </Box>

                  <Divider sx={{ my: 1.5 }} />

                  {/* Publish Time */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                      Publish Time
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      type="datetime-local"
                      value={post.created_at}
                      onChange={(e) => handleFieldChange('created_at', e.target.value)}
                      variant="outlined"
                      helperText={`Set publish date/time in your local time. Visitors will see it in ${timezone} timezone.`}
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                    {post.created_at && (
                      <Button
                        size="small"
                        onClick={() => handleFieldChange('created_at', '')}
                        sx={{ mt: 1 }}
                        fullWidth
                        variant="outlined"
                      >
                        Clear (Use Automatic)
                      </Button>
                    )}
                  </Box>

                  <Divider sx={{ my: 1.5 }} />

                  {/* Summary */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                      Summary
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      value={post.summary}
                      onChange={(e) => handleFieldChange('summary', e.target.value)}
                      placeholder="Brief description for previews..."
                      multiline
                      rows={2}
                      variant="outlined"
                      helperText="Shown in post previews and search results"
                    />
                  </Box>

                  <Divider sx={{ my: 1.5 }} />

                  {/* Tags */}
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                      Tags
                    </Typography>
                    <TagInput
                      selectedTags={post.tags}
                      onTagsChange={(tags: Tag[]) => handleFieldChange('tags', tags)}
                      placeholder="Search or create tags..."
                      allowCreate={true}
                    />
                  </Box>
                </Box>
              )}

              {/* Attachments Tab */}
              {rightPanelTab === 1 && (
                <Box>
                  <PostFileUploader 
                    postId={postId}
                    onFilesChange={(files) => setAttachmentCount(files.length)}
                  />
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default PostEditorPage