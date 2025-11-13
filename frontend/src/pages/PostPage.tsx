import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  CircularProgress,
  Link,
  Card,
  CardContent,
  TextField,
  Button,
  Snackbar,
  Alert,
  Divider,
} from '@mui/material'
import { ArrowBack, CalendarToday, AccessTime, Visibility, Send, Comment as CommentIcon } from '@mui/icons-material'
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
    <Box sx={{ maxWidth: 800, mx: 'auto', py: 6, mt: 4 }}>
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

        {/* View Count */}
        <Box display="flex" alignItems="center">
          <Visibility fontSize="small" color="action" />
          <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
            Views: {post.view_count.toLocaleString()}
          </Typography>
        </Box>
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

      {/* Comments Section */}
      <Box sx={{ mt: 6 }}>
        <Divider sx={{ mb: 4 }} />
        
        {/* Comments Header */}
        <Box display="flex" alignItems="center" sx={{ mb: 3 }}>
          <CommentIcon sx={{ mr: 1 }} />
          <Typography variant="h5" component="h2">
            Comments ({comments.length})
          </Typography>
        </Box>

        {/* Existing Comments */}
        {commentsLoading ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        ) : comments.length > 0 ? (
          <Box sx={{ mb: 4 }}>
            {comments.map((comment) => (
              <Card key={comment.id} sx={{ mb: 2 }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {comment.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(comment.created_at)}
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {comment.content}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        ) : (
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            No comments yet. Be the first to leave a comment!
          </Typography>
        )}

        {/* Comment Form */}
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Leave a Comment
            </Typography>
            <Box component="form" onSubmit={handleCommentSubmit}>
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  label="Name *"
                  value={commentForm.name}
                  onChange={(e) => setCommentForm({ ...commentForm, name: e.target.value })}
                  required
                  disabled={commentSubmitting}
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
                />
              </Box>
              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  label="Comment *"
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
              >
                {commentSubmitting ? 'Submitting...' : 'Submit Comment'}
              </Button>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                Comments are moderated and will be approved before appearing on the site.
              </Typography>
            </Box>
          </CardContent>
        </Card>
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