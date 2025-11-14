import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  CircularProgress,
  Link,
  TextField,
  Button,
  Snackbar,
  Alert,
} from '@mui/material'
import { ArrowBack, Send } from '@mui/icons-material'
import { useParams, useNavigate } from 'react-router-dom'
import { postsAPI, commentsAPI } from '../services/api'
import type { BlogPost, Comment, CreateCommentRequest } from '../services/api'
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
  
  // Comments state
  const [comments, setComments] = useState<Comment[]>([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [commentForm, setCommentForm] = useState({
    name: '',
    email: '',
    content: ''
  })
  const [commentSubmitting, setCommentSubmitting] = useState(false)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  })
  
  // Use dynamic title - will update when post is loaded
  useDocumentTitle(post?.title)

  // Fetch comments for a post
  const fetchComments = async (postId: number) => {
    try {
      setCommentsLoading(true)
      const response = await commentsAPI.getCommentsByPostId(postId)
      setComments(response.data.comments)
    } catch (err) {
      console.error('Error fetching comments:', err)
    } finally {
      setCommentsLoading(false)
    }
  }

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) return

      try {
        setLoading(true)
        const response = await postsAPI.getPublicPost(slug)
        setPost(response.data)
        // Fetch comments after post is loaded
        await fetchComments(response.data.id)
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

  // Handle comment form submission
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!post || !commentForm.name.trim() || !commentForm.content.trim()) {
      setSnackbar({
        open: true,
        message: 'Please fill in all required fields',
        severity: 'error'
      })
      return
    }

    try {
      setCommentSubmitting(true)
      const commentData: CreateCommentRequest = {
        post_id: post.id,
        name: commentForm.name.trim(),
        email: commentForm.email.trim() || undefined,
        content: commentForm.content.trim()
      }

      await commentsAPI.createComment(commentData)
      
      setSnackbar({
        open: true,
        message: 'Comment submitted successfully and is pending moderation',
        severity: 'success'
      })
      
      // Reset form
      setCommentForm({ name: '', email: '', content: '' })
      
      // Refresh comments (though new comment won't show until approved)
      await fetchComments(post.id)
    } catch (err) {
      console.error('Error submitting comment:', err)
      setSnackbar({
        open: true,
        message: 'Failed to submit comment. Please try again.',
        severity: 'error'
      })
    } finally {
      setCommentSubmitting(false)
    }
  }

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', py: 6, mt: 4 }}>
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      </Box>
    )
  }

  if (error || !post) {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', py: 6, mt: 4 }}>
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
    <Box sx={{ maxWidth: 800, mx: 'auto', py: 6, mt: 4, px: 2 }}>
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
          fontSize: { xs: '2rem', md: '3rem' },
          fontWeight: 'normal',
          mb: 2,
          color: 'text.primary',
          lineHeight: 1.2,
        }}
      >
        {post.title}
      </Typography>

      {/* Post Summary */}
      {post.summary && (
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ 
            mb: 3,
            fontSize: '1.1rem',
            lineHeight: 1.6,
          }}
        >
          {post.summary}
        </Typography>
      )}

      {/* Post Metadata */}
      <Box sx={{ mb: 4, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {formatDate(post.created_at)}
        </Typography>
        
        {post.updated_at !== post.created_at && (
          <>
            <Typography variant="body2" color="text.secondary">•</Typography>
            <Typography variant="body2" color="text.secondary">
              Updated {formatDate(post.updated_at)}
            </Typography>
          </>
        )}

        <Typography variant="body2" color="text.secondary">•</Typography>
        <Typography variant="body2" color="text.secondary">
          {post.view_count.toLocaleString()} views
        </Typography>
      </Box>

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <TagList tags={post.tags} />
        </Box>
      )}

      {/* Post Content */}
      <Box
        sx={(theme) => ({
          mb: 6,
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
            lineHeight: 1.7,
            color: theme.palette.text.primary,
            fontFamily: theme.typography.fontFamily,
          },
          '& .wmde-markdown h1, & .wmde-markdown h2, & .wmde-markdown h3, & .wmde-markdown h4, & .wmde-markdown h5, & .wmde-markdown h6': {
            marginTop: '2rem',
            marginBottom: '1rem',
            fontFamily: theme.typography.fontFamily,
            fontWeight: 600,
            color: theme.palette.text.primary,
          },
          '& .wmde-markdown h1': {
            fontSize: '2rem',
          },
          '& .wmde-markdown h2': {
            fontSize: '1.5rem',
          },
          '& .wmde-markdown h3': {
            fontSize: '1.25rem',
          },
          '& .wmde-markdown p': {
            marginBottom: '1rem',
            fontFamily: theme.typography.fontFamily,
          },
          '& .wmde-markdown ul, & .wmde-markdown ol': {
            marginBottom: '1rem',
            paddingLeft: '1.5rem',
            fontFamily: theme.typography.fontFamily,
          },
          '& .wmde-markdown li': {
            marginBottom: '0.5rem',
            fontFamily: theme.typography.fontFamily,
          },
          '& .wmde-markdown blockquote': {
            borderLeft: `4px solid ${theme.palette.divider}`,
            paddingLeft: '1rem',
            marginLeft: 0,
            marginBottom: '1rem',
            color: theme.palette.text.secondary,
            fontFamily: theme.typography.fontFamily,
          },
          '& .wmde-markdown pre': {
            backgroundColor: theme.palette.mode === 'dark' ? '#2d2d2d' : '#f5f5f5',
            padding: '1rem',
            borderRadius: '4px',
            overflow: 'auto',
            marginBottom: '1rem',
          },
          '& .wmde-markdown code': {
            backgroundColor: theme.palette.mode === 'dark' ? '#2d2d2d' : '#f5f5f5',
            padding: '0.2rem 0.4rem',
            borderRadius: '3px',
            fontSize: '0.9em',
          },
          '& .wmde-markdown a': {
            color: theme.palette.primary.main,
            textDecoration: 'none',
            '&:hover': {
              textDecoration: 'underline',
            },
            fontFamily: theme.typography.fontFamily,
          },
          '& .wmde-markdown img': {
            maxWidth: '100%',
            height: 'auto',
            borderRadius: '4px',
          },
          '& .wmde-markdown table': {
            fontFamily: theme.typography.fontFamily,
            borderCollapse: 'collapse',
            width: '100%',
            marginBottom: '1rem',
          },
          '& .wmde-markdown th, & .wmde-markdown td': {
            border: `1px solid ${theme.palette.divider}`,
            padding: '0.5rem',
          },
        })}
      >
        <MDEditor.Markdown
          source={post.content}
          data-color-mode="light"
        />
      </Box>

      {/* Comments Section */}
      <Box sx={{ mt: 8, pt: 4, borderTop: 1, borderColor: 'divider' }}>
        {/* Comments Header */}
        <Typography variant="h5" component="h2" sx={{ mb: 3, fontWeight: 'normal' }}>
          Comments ({comments.length})
        </Typography>

        {/* Existing Comments */}
        {commentsLoading ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        ) : comments.length > 0 ? (
          <Box sx={{ mb: 4 }}>
            {comments.map((comment) => (
              <Box 
                key={comment.id} 
                sx={{ 
                  mb: 3,
                  pb: 3,
                  borderBottom: 1,
                  borderColor: 'divider',
                  '&:last-child': {
                    borderBottom: 0,
                  }
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="baseline" sx={{ mb: 1 }}>
                  <Typography variant="subtitle1" fontWeight="medium" color="text.primary">
                    {comment.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(comment.created_at)}
                  </Typography>
                </Box>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', color: 'text.primary' }}>
                  {comment.content}
                </Typography>
              </Box>
            ))}
          </Box>
        ) : (
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            No comments yet. Be the first to leave a comment!
          </Typography>
        )}

        {/* Comment Form */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 'normal' }}>
            Leave a Comment
          </Typography>
          <Box component="form" onSubmit={handleCommentSubmit}>
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                label="Name"
                value={commentForm.name}
                onChange={(e) => setCommentForm({ ...commentForm, name: e.target.value })}
                required
                disabled={commentSubmitting}
                size="small"
              />
            </Box>
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                label="Email (optional)"
                type="email"
                value={commentForm.email}
                onChange={(e) => setCommentForm({ ...commentForm, email: e.target.value })}
                disabled={commentSubmitting}
                size="small"
              />
            </Box>
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                label="Comment"
                multiline
                rows={4}
                value={commentForm.content}
                onChange={(e) => setCommentForm({ ...commentForm, content: e.target.value })}
                required
                disabled={commentSubmitting}
                placeholder="Write your comment here..."
              />
            </Box>
            <Button
              type="submit"
              variant="contained"
              disabled={commentSubmitting || !commentForm.name.trim() || !commentForm.content.trim()}
              startIcon={<Send />}
              sx={{ mb: 1 }}
            >
              {commentSubmitting ? 'Submitting...' : 'Submit Comment'}
            </Button>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Comments are moderated and will be approved before appearing.
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Snackbar for notifications */}
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
  )
}

export default PostPage