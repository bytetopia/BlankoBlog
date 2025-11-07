import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  Chip,
  CircularProgress,
  Button,
} from '@mui/material'
import { ArrowBack, AccessTime, CalendarToday } from '@mui/icons-material'
import { useParams, useNavigate } from 'react-router-dom'
import { postsAPI } from '../services/api'
import type { BlogPost } from '../services/api'

const PostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) return

      try {
        setLoading(true)
        const response = await postsAPI.getPost(slug)
        setPost(response.data)
      } catch (err: any) {
        if (err.response?.status === 404) {
          setError('Blog post not found')
        } else {
          setError('Failed to load blog post')
        }
        console.error('Error fetching post:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchPost()
  }, [slug])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    )
  }

  if (error || !post) {
    return (
      <Box textAlign="center" mt={4}>
        <Typography variant="h5" color="error" gutterBottom>
          {error || 'Post not found'}
        </Typography>
        <Button
          variant="contained"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/')}
          sx={{ mt: 2 }}
        >
          Back to Home
        </Button>
      </Box>
    )
  }

  return (
    <Box>
      {/* Back Button */}
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/')}
        sx={{ mb: 3 }}
      >
        Back to Blog
      </Button>

      {/* Post Content */}
      <Paper sx={{ p: 4 }}>
        {/* Post Header */}
        <Box mb={3}>
          <Typography variant="h3" component="h1" gutterBottom>
            {post.title}
          </Typography>
          
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Box display="flex" alignItems="center">
              <CalendarToday fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary" ml={0.5}>
                Published: {formatDate(post.created_at)}
              </Typography>
            </Box>
            
            {post.updated_at !== post.created_at && (
              <Box display="flex" alignItems="center">
                <AccessTime fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary" ml={0.5}>
                  Updated: {formatDate(post.updated_at)}
                </Typography>
              </Box>
            )}
            
            <Chip
              label={post.published ? 'Published' : 'Draft'}
              color={post.published ? 'success' : 'warning'}
              size="small"
            />
          </Box>

          {/* Summary */}
          {post.summary && (
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{ fontStyle: 'italic', mb: 2 }}
            >
              {post.summary}
            </Typography>
          )}
        </Box>

        {/* Post Content */}
        <Typography
          variant="body1"
          component="div"
          sx={{
            lineHeight: 1.8,
            '& p': { mb: 2 },
            whiteSpace: 'pre-line',
          }}
        >
          {post.content}
        </Typography>
      </Paper>
    </Box>
  )
}

export default PostPage