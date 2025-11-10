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
  CircularProgress,
  Alert,
} from '@mui/material'
import {
  Add,
  Edit,
  Delete,
  Visibility,
  VisibilityOff,
  LocalOffer,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { postsAPI } from '../services/api'
import type { BlogPost } from '../services/api'

const AdminPage: React.FC = () => {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

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

  const handleCreatePost = () => {
    navigate('/admin/posts/new')
  }

  const handleEditPost = (post: BlogPost) => {
    navigate(`/admin/posts/${post.id}`)
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
        <Typography variant="h5" component="h1">
          Admin Panel
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<LocalOffer />}
            onClick={() => navigate('/admin/tags')}
          >
            Manage Tags
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreatePost}
          >
            New Post
          </Button>
        </Box>
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
                      onClick={() => handleEditPost(post)}
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
    </Box>
  )
}

export default AdminPage