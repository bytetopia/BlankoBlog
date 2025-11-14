import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  CircularProgress,
  Link,
} from '@mui/material'
import { ArrowBack } from '@mui/icons-material'
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
      <Box sx={{ maxWidth: 800, mx: 'auto', py: 6, mt: 4 }}>
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      </Box>
    )
  }

  if (error) {
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
          {error}
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

      {/* Page Title */}
      <Typography 
        variant="h2" 
        component="h1" 
        sx={{ 
          fontSize: { xs: '2rem', md: '3rem' },
          fontWeight: 'normal',
          textAlign: 'left',
          mb: 4,
          ml: 3, // Align with list items
          color: 'primary.main',
        }}
      >
        Tags
      </Typography>

      {/* Tags List */}
      {tags.length === 0 ? (
        <Box textAlign="center" mt={4}>
          <Typography variant="h6" color="text.secondary">
            No tags available yet.
          </Typography>
        </Box>
      ) : (
        <List sx={{ p: 0 }}>
          {tags.map((tag) => (
            <ListItem 
              key={tag.id} 
              sx={{ px: 0 }}
            >
              <ListItemButton
                onClick={() => handleTagClick(tag)}
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
                  {tag.name}
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
                  {tag.post_count}
                </Typography>
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  )
}

export default TagsPage