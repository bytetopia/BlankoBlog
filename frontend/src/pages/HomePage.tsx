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
} from '@mui/material'
import { LocalOffer } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { postsAPI } from '../services/api'
import type { BlogPost, PaginatedPostsResponse } from '../services/api'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

const HomePage: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    total_pages: 1,
    total: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const navigate = useNavigate()
  
  // Use the custom hook for document title and get site name
  const { blogName } = useDocumentTitle()

  const fetchPosts = async (page = 1) => {
    try {
      setLoading(true)
      const response = await postsAPI.getPosts(page, 10, true) // 10 posts per page
      const data: PaginatedPostsResponse = response.data
      setPosts(data.posts || [])
      setPagination(data.pagination || {
        page: 1,
        total_pages: 1,
        total: 0,
      })
    } catch (err) {
      setError('Failed to load blog posts')
      console.error('Error fetching posts:', err)
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    fetchPosts(value)
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
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box textAlign="center" mt={4}>
        <Typography color="error" variant="h6">
          {error}
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', py: 6, mt: 4 }}>
      {/* Site Title */}
      <Typography 
        variant="h2" 
        component="h1" 
        sx={{ 
          fontSize: { xs: '2.5rem', md: '3.5rem' },
          fontWeight: 'bold',
          textAlign: 'left',
          mb: 4,
          ml: 3, // Align with post list text (mx: 1 + px: 2 = 3)
          color: 'primary.main'
        }}
      >
        {blogName}
      </Typography>

      {/* Posts List */}
      {posts.length === 0 ? (
        <Box textAlign="center" mt={4}>
          <Typography variant="h6" color="text.secondary">
            No blog posts yet. Check back soon!
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

      {/* Tags Link */}
      <Box 
        sx={{ 
          mt: 6, 
          pt: 4, 
          borderTop: 1, 
          borderColor: 'divider',
          textAlign: 'center'
        }}
      >
        <Link
          onClick={() => navigate('/tags')}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            color: 'primary.main',
            textDecoration: 'none',
            fontSize: '1.1rem',
            fontWeight: 500,
            cursor: 'pointer',
            '&:hover': {
              textDecoration: 'underline',
            }
          }}
        >
          <LocalOffer sx={{ mr: 1 }} fontSize="small" />
          Browse All Tags
        </Link>
      </Box>
    </Box>
  )
}

export default HomePage