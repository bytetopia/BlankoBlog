import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  CircularProgress,
  Link,
} from '@mui/material'
import { ArrowBack, CalendarToday, AccessTime } from '@mui/icons-material'
import { useParams, useNavigate } from 'react-router-dom'
import { postsAPI } from '../services/api'
import type { BlogPost } from '../services/api'
import TagList from '../components/TagList'
import MDEditor from '@uiw/react-md-editor'
import '@uiw/react-md-editor/markdown-editor.css'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

const PostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  
  // Use dynamic title - will update when post is loaded
  useDocumentTitle(post?.title)

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
      <Box sx={{ maxWidth: 800, mx: 'auto', py: 4 }}>
        <Link
          onClick={() => navigate('/')}
          sx={{ 
            display: 'flex',
            alignItems: 'center',
            mb: 3,
            color: 'primary.main',
            textDecoration: 'none',
            cursor: 'pointer',
            '&:hover': {
              textDecoration: 'underline'
            }
          }}
        >
          <ArrowBack sx={{ mr: 1 }} fontSize="small" />
          Back to Home
        </Link>
        
        <Typography variant="h5" color="error" textAlign="center">
          {error || 'Post not found'}
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', py: 4 }}>
      {/* Back to Home Link */}
      <Link
        onClick={() => navigate('/')}
        sx={{ 
          display: 'flex',
          alignItems: 'center',
          mb: 3,
          color: 'primary.main',
          textDecoration: 'none',
          cursor: 'pointer',
          '&:hover': {
            textDecoration: 'underline'
          }
        }}
      >
        <ArrowBack sx={{ mr: 1 }} fontSize="small" />
        Back to Home
      </Link>

      {/* Post Title */}
      <Typography 
        variant="h2" 
        component="h1" 
        sx={{ 
          fontSize: { xs: '2rem', md: '2.5rem' },
          fontWeight: 'bold',
          mb: 3,
          color: 'text.primary'
        }}
      >
        {post.title}
      </Typography>

      {/* Post Summary */}
      {post.summary && (
        <Typography
          variant="h6"
          color="text.secondary"
          sx={{ 
            fontStyle: 'italic', 
            mb: 3,
            fontWeight: 'normal'
          }}
        >
          {post.summary}
        </Typography>
      )}

      {/* Post Dates */}
      <Box sx={{ mb: 3 }}>
        <Box display="flex" alignItems="center" sx={{ mb: 1 }}>
          <CalendarToday fontSize="small" color="action" />
          <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
            Published: {formatDate(post.created_at)}
          </Typography>
        </Box>
        
        {post.updated_at !== post.created_at && (
          <Box display="flex" alignItems="center">
            <AccessTime fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              Updated: {formatDate(post.updated_at)}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            Tags:
          </Typography>
          <TagList tags={post.tags} />
        </Box>
      )}

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
            fontSize: '1.1rem',
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
            marginBottom: '1.2rem',
          },
          '& .wmde-markdown ul, & .wmde-markdown ol': {
            marginBottom: '1.2rem',
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
    </Box>
  )
}

export default PostPage