import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  CircularProgress,
  Chip,
  Link,
} from '@mui/material'
import { ArrowBack, LocalOffer } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { tagsAPI } from '../services/api'
import type { TagWithPostCount } from '../services/api'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

const TagsPage: React.FC = () => {
  const [tags, setTags] = useState<TagWithPostCount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const navigate = useNavigate()
  
  useDocumentTitle('Tags')

  useEffect(() => {
    const fetchTags = async () => {
      try {
        setLoading(true)
        const response = await tagsAPI.getAllTagsWithPostCount()
        setTags(response.data.tags)
      } catch (err: any) {
        setError('Failed to load tags')
        console.error('Error fetching tags:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchTags()
  }, [])

  const handleTagClick = (tag: TagWithPostCount) => {
    navigate(`/tags/${tag.id}/posts`)
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
          {error}
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', py: 6, mt: 4 }}>
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

      {/* Page Title */}
      <Typography 
        variant="h2" 
        component="h1" 
        sx={{ 
          fontSize: { xs: '2.5rem', md: '3rem' },
          fontWeight: 'bold',
          mb: 2,
          color: 'primary.main',
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}
      >
        <LocalOffer sx={{ fontSize: 'inherit' }} />
        Tags
      </Typography>

      <Typography 
        variant="body1" 
        color="text.secondary" 
        sx={{ mb: 4 }}
      >
        Explore all topics and discover posts by category
      </Typography>

      {/* Tags Grid */}
      {tags.length === 0 ? (
        <Box textAlign="center" mt={4}>
          <Typography variant="h6" color="text.secondary">
            No tags available yet.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
          {tags.map((tag) => (
            <Card 
              key={tag.id}
              sx={{ 
                height: '100%',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: (theme) => theme.shadows[8],
                }
              }}
            >
              <CardActionArea 
                onClick={() => handleTagClick(tag)}
                sx={{ height: '100%', p: 0 }}
              >
                <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  {/* Tag Chip */}
                  <Box sx={{ mb: 2 }}>
                    <Chip
                      label={tag.name}
                      sx={{
                        backgroundColor: tag.color || '#1976d2',
                        color: '#ffffff',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        '& .MuiChip-label': {
                          color: '#ffffff',
                        },
                      }}
                    />
                  </Box>

                  {/* Post Count */}
                  <Typography 
                    variant="h4" 
                    component="div"
                    sx={{ 
                      fontWeight: 'bold',
                      mb: 1,
                      color: 'primary.main'
                    }}
                  >
                    {tag.post_count}
                  </Typography>

                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    {tag.post_count === 1 ? 'post' : 'posts'}
                  </Typography>

                  {/* Created Date */}
                  <Typography 
                    variant="caption" 
                    color="text.disabled"
                    sx={{ mt: 'auto' }}
                  >
                    Created {new Date(tag.created_at).toLocaleDateString()}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  )
}

export default TagsPage