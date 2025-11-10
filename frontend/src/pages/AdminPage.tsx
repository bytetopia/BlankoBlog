import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  CircularProgress,
  Alert,
} from '@mui/material'
import {
  Add,
  Edit,
  Delete,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { postsAPI } from '../services/api'
import type { BlogPost, CreatePostRequest, UpdatePostRequest } from '../services/api'

interface PostDialogData {
  id?: number
  title: string
  content: string
  summary: string
  published: boolean
}

const AdminPage: React.FC = () => {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPost, setEditingPost] = useState<PostDialogData>({
    title: '',
    content: '',
    summary: '',
    published: false,
  })
  const [isEditing, setIsEditing] = useState(false)

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
    }
  }, [isAuthenticated, navigate])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const response = await postsAPI.getPosts(1, 100, false) // Get all posts including drafts
      setPosts(response.data.posts || [])
    } catch (err) {
      setError('Failed to load posts')
      console.error('Error fetching posts:', err)
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchPosts()
    }
  }, [isAuthenticated])

  const handleOpenDialog = (post?: BlogPost) => {
    if (post) {
      setEditingPost({
        id: post.id,
        title: post.title,
        content: post.content,
        summary: post.summary,
        published: post.published,
      })
      setIsEditing(true)
    } else {
      setEditingPost({
        title: '',
        content: '',
        summary: '',
        published: false,
      })
      setIsEditing(false)
    }
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingPost({
      title: '',
      content: '',
      summary: '',
      published: false,
    })
    setIsEditing(false)
  }

  const handleSavePost = async () => {
    try {
      if (isEditing && editingPost.id) {
        const updateData: UpdatePostRequest = {
          title: editingPost.title,
          content: editingPost.content,
          summary: editingPost.summary,
          published: editingPost.published,
        }
        await postsAPI.updatePost(editingPost.id, updateData)
      } else {
        const createData: CreatePostRequest = {
          title: editingPost.title,
          content: editingPost.content,
          summary: editingPost.summary,
          published: editingPost.published,
        }
        await postsAPI.createPost(createData)
      }
      
      handleCloseDialog()
      fetchPosts() // Refresh the list
    } catch (err) {
      console.error('Error saving post:', err)
      setError('Failed to save post')
    }
  }

  const handleDeletePost = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await postsAPI.deletePost(id)
        fetchPosts() // Refresh the list
      } catch (err) {
        console.error('Error deleting post:', err)
        setError('Failed to delete post')
      }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (!isAuthenticated) {
    return null
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1">
          Admin Panel
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          New Post
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Updated</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {posts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No posts found. Create your first post!
                </TableCell>
              </TableRow>
            ) : (
              posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell>
                    <Typography variant="subtitle1">
                      {post.title}
                    </Typography>
                    {post.summary && (
                      <Typography variant="caption" color="text.secondary">
                        {post.summary.substring(0, 100)}...
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={post.published ? 'Published' : 'Draft'}
                      color={post.published ? 'success' : 'warning'}
                      size="small"
                      icon={post.published ? <Visibility /> : <VisibilityOff />}
                    />
                  </TableCell>
                  <TableCell>{formatDate(post.created_at)}</TableCell>
                  <TableCell>{formatDate(post.updated_at)}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(post)}
                      color="primary"
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeletePost(post.id)}
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Post Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {isEditing ? 'Edit Post' : 'Create New Post'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Title"
              value={editingPost.title}
              onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })}
              margin="normal"
            />
            
            <TextField
              fullWidth
              label="Summary (optional)"
              value={editingPost.summary}
              onChange={(e) => setEditingPost({ ...editingPost, summary: e.target.value })}
              margin="normal"
              multiline
              rows={2}
            />
            
            <TextField
              fullWidth
              label="Content"
              value={editingPost.content}
              onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })}
              margin="normal"
              multiline
              rows={10}
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={editingPost.published}
                  onChange={(e) => setEditingPost({ ...editingPost, published: e.target.checked })}
                />
              }
              label="Publish immediately"
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSavePost}
            variant="contained"
            disabled={!editingPost.title || !editingPost.content}
          >
            {isEditing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default AdminPage