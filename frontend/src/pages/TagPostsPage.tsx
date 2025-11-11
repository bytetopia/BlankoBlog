import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  Pagination,
  CircularProgress,
  Link,
  Chip,
  Breadcrumbs,
} from '@mui/material'
import { ArrowBack, LocalOffer, Home } from '@mui/icons-material'
import { useParams, useNavigate } from 'react-router-dom'
import { tagsAPI } from '../services/api'
import type { BlogPost, PaginatedPostsResponse, Tag } from '../services/api'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

const TagPostsPage: React.FC = () => {
  const { tagId } = useParams<{ tagId: string }>()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [tag, setTag] = useState<Tag | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    total_pages: 1,
    total: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const navigate = useNavigate()
  
  // Use dynamic title - will update when tag is loaded
  useDocumentTitle(tag ? `Posts tagged "${tag.name}"` : 'Tag Posts')

  const fetchTagAndPosts = async (page = 1) => {
    if (!tagId) return

    try {
      setLoading(true)
      const tagIdNum = parseInt(tagId)
      
      // Fetch tag details and posts in parallel
      const [tagResponse, postsResponse] = await Promise.all([
        tagsAPI.getTag(tagIdNum),
        tagsAPI.getPostsByTag(tagIdNum, page, 10, true)
      ])
      
      setTag(tagResponse.data.tag)
      const data: PaginatedPostsResponse = postsResponse.data
      setPosts(data.posts || [])
      setPagination(data.pagination || {
        page: 1,
        total_pages: 1,
        total: 0,
      })
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('Tag not found')
      } else {
        setError('Failed to load tag posts')
      }
      console.error('Error fetching tag posts:', err)
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTagAndPosts()
  }, [tagId])

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    fetchTagAndPosts(value)
    window.scrollTo({ top: 0, behavior: 'smooth' })
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

  if (error || !tag) {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', py: 6, mt: 4 }}>
        <Link
          onClick={() => navigate('/tags')}
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
          Back to Tags
        </Link>
        
        <Typography variant="h5" color="error" textAlign="center">
          {error || 'Tag not found'}
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', py: 6, mt: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }} separator="›">
        <Link
          onClick={() => navigate('/')}
          sx={{ 
            display: 'flex',
            alignItems: 'center',
            color: 'primary.main',
            textDecoration: 'none',
            cursor: 'pointer',
            '&:hover': {
              textDecoration: 'underline'
            }
          }}
        >
          <Home sx={{ mr: 0.5 }} fontSize="small" />
          Home
        </Link>
        <Link
          onClick={() => navigate('/tags')}
          sx={{ 
            display: 'flex',
            alignItems: 'center',
            color: 'primary.main',
            textDecoration: 'none',
            cursor: 'pointer',
            '&:hover': {
              textDecoration: 'underline'
            }
          }}
        >
          <LocalOffer sx={{ mr: 0.5 }} fontSize="small" />
          Tags
        </Link>
        <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
          {tag.name}
        </Typography>
      </Breadcrumbs>

      {/* Tag Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Chip
            label={tag.name}
            sx={{
              backgroundColor: tag.color || '#1976d2',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '1.1rem',
              height: 40,
              '& .MuiChip-label': {
                color: '#ffffff',
                px: 2,
              },
            }}
          />
          <Typography 
            variant="h3" 
            component="h1" 
            sx={{ 
              fontSize: { xs: '2rem', md: '2.5rem' },
              fontWeight: 'bold',
              color: 'text.primary'
            }}
          >
            Posts
          </Typography>
        </Box>
        
        <Typography variant="body1" color="text.secondary">
          {pagination.total} {pagination.total === 1 ? 'post' : 'posts'} tagged with "{tag.name}"
        </Typography>
      </Box>

      {/* Posts List */}
      {posts.length === 0 ? (
        <Box textAlign="center" mt={4}>
          <Typography variant="h6" color="text.secondary">
            No posts found for this tag.
          </Typography>
        </Box>
      ) : (
        <>
          <List sx={{ p: 0 }}>
            {posts.map((post) => (
              <ListItem 
                key={post.id} 
                sx={{ 
                  px: 0,
                }}
              >
                <ListItemButton
                  onClick={() => navigate(`/posts/${post.slug}`)}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 1.5,
                    px: 2,
                    borderRadius: 2,
                    mx: 1,
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    }
                  }}
                >
                  <Typography 
                    variant="h6" 
                    component="h2"
                    sx={{ 
                      fontWeight: 'medium',
                      color: 'text.primary',
                      textAlign: 'left',
                      flex: 1
                    }}
                  >
                    {post.title}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ 
                      textAlign: 'right',
                      minWidth: 'fit-content',
                      ml: 2
                    }}
                  >
                    {formatDate(post.created_at)}
                  </Typography>
                </ListItemButton>
              </ListItem>
            ))}
          </List>

          {/* Pagination */}
          {pagination.total_pages > 1 && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Pagination
                count={pagination.total_pages}
                page={pagination.page}
                onChange={handlePageChange}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </>
      )}
    </Box>
  )
}

export default TagPostsPage