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
import TagList from '../components/TagList'
import MDEditor from '@uiw/react-md-editor'
import '@uiw/react-md-editor/markdown-editor.css'

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

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Tags:
              </Typography>
              <TagList tags={post.tags} />
            </Box>
          )}
        </Box>

        {/* Post Content */}
        <Box
          sx={{
            '& .w-md-editor': {
              backgroundColor: 'transparent',
            },
            '& .w-md-editor-preview': {
              padding: 0,
              backgroundColor: 'transparent',
              boxShadow: 'none',
            },
            '& .wmde-markdown': {
              backgroundColor: 'transparent',
              fontSize: '1rem',
              lineHeight: 1.8,
              color: 'inherit',
            },
            '& .wmde-markdown h1, & .wmde-markdown h2, & .wmde-markdown h3, & .wmde-markdown h4, & .wmde-markdown h5, & .wmde-markdown h6': {
              marginTop: '2rem',
              marginBottom: '1rem',
            },
            '& .wmde-markdown h1': {
              fontSize: '2rem',
            },
            '& .wmde-markdown h2': {
              fontSize: '1.75rem',
            },
            '& .wmde-markdown h3': {
              fontSize: '1.5rem',
            },
            '& .wmde-markdown p': {
              marginBottom: '1rem',
            },
            '& .wmde-markdown ul, & .wmde-markdown ol': {
              marginBottom: '1rem',
              paddingLeft: '2rem',
            },
            '& .wmde-markdown blockquote': {
              borderLeft: '4px solid #ddd',
              paddingLeft: '1rem',
              marginLeft: 0,
              fontStyle: 'italic',
              color: '#666',
            },
            '& .wmde-markdown pre': {
              backgroundColor: '#f5f5f5',
              padding: '1rem',
              borderRadius: '4px',
              overflow: 'auto',
            },
            '& .wmde-markdown code': {
              backgroundColor: '#f5f5f5',
              padding: '0.2rem 0.4rem',
              borderRadius: '3px',
              fontSize: '0.9em',
            },
          }}
        >
          <MDEditor.Markdown
            source={post.content}
            data-color-mode="light"
          />
        </Box>
      </Paper>
    </Box>
  )
}

export default PostPage