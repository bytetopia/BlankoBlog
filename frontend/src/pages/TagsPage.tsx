import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { tagsAPI } from '../services/api';
import type { Tag, CreateTagRequest, UpdateTagRequest } from '../services/api';

const TagsPage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [deleteConfirmTag, setDeleteConfirmTag] = useState<Tag | null>(null);

  // Redirect if not admin
  if (!isAuthenticated || !user?.is_admin) {
    return (
      <Box sx={{ p: 4 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h4" color="error" gutterBottom>
            Access Denied
          </Typography>
          <Typography variant="body1">
            You must be an admin to manage tags.
          </Typography>
        </Box>
      </Box>
    );
  }

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      setLoading(true);
      const response = await tagsAPI.getAllTags();
      setTags(response.data.tags || []);
    } catch (error) {
      setError('Failed to load tags');
      console.error('Error loading tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTag = async (tagData: CreateTagRequest) => {
    try {
      const response = await tagsAPI.createTag(tagData);
      setTags([...tags, response.data.tag]);
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Error creating tag:', error);
      setError('Failed to create tag');
    }
  };

  const handleUpdateTag = async (id: number, tagData: UpdateTagRequest) => {
    try {
      const response = await tagsAPI.updateTag(id, tagData);
      setTags(tags.map(tag => tag.id === id ? response.data.tag : tag));
      setIsEditModalOpen(false);
      setEditingTag(null);
    } catch (error) {
      console.error('Error updating tag:', error);
      setError('Failed to update tag');
    }
  };

  const handleDeleteTag = async (id: number) => {
    try {
      await tagsAPI.deleteTag(id);
      setTags(tags.filter(tag => tag.id !== id));
      setDeleteConfirmTag(null);
    } catch (error) {
      console.error('Error deleting tag:', error);
      setError('Failed to delete tag');
    }
  };

  const openEditModal = (tag: Tag) => {
    setEditingTag(tag);
    setIsEditModalOpen(true);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Tag Management
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Manage tags for your blog posts
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Box>

      {/* Create Button */}
      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setIsCreateModalOpen(true)}
        >
          Create New Tag
        </Button>
      </Box>

      {/* Tags Grid */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, 
        gap: 2 
      }}>
        {tags.map((tag) => (
          <Card key={tag.id} sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    backgroundColor: tag.color || '#1976d2',
                    flexShrink: 0,
                  }}
                />
                <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
                  {tag.name}
                </Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary">
                Created: {new Date(tag.created_at).toLocaleDateString()}
              </Typography>
            </CardContent>
            
            <CardActions>
              <Button
                size="small"
                startIcon={<Edit />}
                onClick={() => openEditModal(tag)}
              >
                Edit
              </Button>
              <Button
                size="small"
                startIcon={<Delete />}
                color="error"
                onClick={() => setDeleteConfirmTag(tag)}
              >
                Delete
              </Button>
            </CardActions>
          </Card>
        ))}
      </Box>

      {tags.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No tags found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create your first tag to get started
          </Typography>
        </Box>
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <TagFormModal
          title="Create New Tag"
          onSubmit={(data) => handleCreateTag(data)}
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}

      {/* Edit Modal */}
      {isEditModalOpen && editingTag && (
        <TagFormModal
          title="Edit Tag"
          initialData={editingTag}
          onSubmit={(data) => handleUpdateTag(editingTag.id, data)}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingTag(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmTag && (
        <DeleteConfirmModal
          tag={deleteConfirmTag}
          onConfirm={() => handleDeleteTag(deleteConfirmTag.id)}
          onCancel={() => setDeleteConfirmTag(null)}
        />
      )}
    </Box>
  );
};

// Tag Form Modal Component
interface TagFormModalProps {
  title: string;
  initialData?: Tag;
  onSubmit: (data: { name: string; color: string }) => void;
  onClose: () => void;
}

const TagFormModal: React.FC<TagFormModalProps> = ({ title, initialData, onSubmit, onClose }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [color, setColor] = useState(initialData?.color || '#1976d2');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), color });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Tag Name"
            fullWidth
            variant="outlined"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter tag name"
            required
            disabled={isSubmitting}
            sx={{ mb: 2 }}
          />

          <Typography variant="body2" sx={{ mb: 1 }}>
            Color
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Box
              component="input"
              type="color"
              value={color}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setColor(e.target.value)}
              sx={{
                width: 48,
                height: 40,
                border: '1px solid',
                borderColor: 'grey.300',
                borderRadius: 1,
                cursor: 'pointer',
                '&:disabled': { opacity: 0.6, cursor: 'not-allowed' }
              }}
              disabled={isSubmitting}
            />
            <TextField
              size="small"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="#1976d2"
              disabled={isSubmitting}
              sx={{ flex: 1 }}
            />
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
            <Typography variant="body2">Preview:</Typography>
            <Chip
              label={name || 'Tag Name'}
              sx={{
                backgroundColor: color,
                color: '#fff',
                '& .MuiChip-label': { fontWeight: 500 }
              }}
            />
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting || !name.trim()}
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

// Delete Confirmation Modal Component
interface DeleteConfirmModalProps {
  tag: Tag;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ tag, onConfirm, onCancel }) => {
  return (
    <Dialog open={true} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ color: 'error.main' }}>Delete Tag</DialogTitle>
      <DialogContent>
        <Typography variant="body1" gutterBottom>
          Are you sure you want to delete the tag{' '}
          <Chip
            label={tag.name}
            sx={{
              backgroundColor: tag.color || '#1976d2',
              color: '#fff',
              mx: 0.5,
            }}
          />
          ?
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          This action cannot be undone. The tag will be removed from all posts.
        </Typography>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onConfirm} variant="contained" color="error">
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TagsPage;