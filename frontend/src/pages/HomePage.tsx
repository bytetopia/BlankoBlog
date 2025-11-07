import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Pagination,
  CircularProgress,
} from '@mui/material'
import { AccessTime, Visibility } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { postsAPI } from '../services/api'
import type { BlogPost, PaginatedPostsResponse } from '../services/api'

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

  const fetchPosts = async (page = 1) => {
    try {
      setLoading(true)
      const response = await postsAPI.getPosts(page, 6, true)
      const data: PaginatedPostsResponse = response.data
      setPosts(data.posts)
      setPagination(data.pagination)
    } catch (err) {
      setError('Failed to load blog posts')
      console.error('Error fetching posts:', err)
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
    <Box>
      {/* Hero Section */}
      <Box textAlign="center" mb={6}>
        <Typography variant="h2" component="h1" gutterBottom>
          Welcome to Blanko Blog
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph>
          Your space for ideas and insights
        </Typography>
      </Box>

      {/* Posts Grid */}
      {posts.length === 0 ? (
        <Box textAlign="center" mt={4}>
          <Typography variant="h6" color="text.secondary">
            No blog posts yet. Check back soon!
          </Typography>
        </Box>
      ) : (
        <>
          <Box
            display="grid"
            gridTemplateColumns={{ xs: "1fr", md: "1fr 1fr" }}
            gap={3}
          >
            {posts.map((post) => (
              <Box key={post.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    },
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <AccessTime fontSize="small" color="action" />
                      <Typography variant="caption" color="text.secondary" ml={0.5}>
                        {formatDate(post.created_at)}
                      </Typography>
                      <Chip
                        label="Published"
                        size="small"
                        color="success"
                        sx={{ ml: 'auto' }}
                      />
                    </Box>
                    
                    <Typography variant="h5" component="h2" gutterBottom>
                      {post.title}
                    </Typography>
                    
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      paragraph
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {post.summary || post.content.substring(0, 200) + '...'}
                    </Typography>
                    
                    <Button
                      variant="contained"
                      startIcon={<Visibility />}
                      onClick={() => navigate(`/posts/${post.slug}`)}
                      sx={{ mt: 'auto' }}
                    >
                      Read More
                    </Button>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>

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

export default HomePage