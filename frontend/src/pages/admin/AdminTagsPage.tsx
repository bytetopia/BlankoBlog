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
import { useAuth } from '../../contexts/AuthContext';
import { tagsAPI } from '../../services/api';
import type { Tag, CreateTagRequest, UpdateTagRequest } from '../../services/api';
import AdminNavbar from '../../components/AdminNavbar';

const AdminTagsPage: React.FC = () => {
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
      <Box>
        <AdminNavbar />
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
      setTags(response.data.tags);
    } catch (err) {
      setError('Failed to load tags');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTag = async (tagData: CreateTagRequest) => {
    try {
      await tagsAPI.createTag(tagData);
      await loadTags();
      setIsCreateModalOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create tag');
    }
  };

  const handleUpdateTag = async (id: number, tagData: UpdateTagRequest) => {
    try {
      await tagsAPI.updateTag(id, tagData);
      await loadTags();
      setIsEditModalOpen(false);
      setEditingTag(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update tag');
    }
  };

  const handleDeleteTag = async (id: number) => {
    try {
      await tagsAPI.deleteTag(id);
      await loadTags();
      setDeleteConfirmTag(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete tag');
    }
  };

  const openEditModal = (tag: Tag) => {
    setEditingTag(tag);
    setIsEditModalOpen(true);
  };

  const openDeleteConfirm = (tag: Tag) => {
    setDeleteConfirmTag(tag);
  };

  return (
    <Box>
      <AdminNavbar />
      <Box sx={{ px: 4, py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1">
            Tags Management
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setIsCreateModalOpen(true)}
            size="large"
          >
            Create Tag
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {tags.length === 0 ? (
              <Typography variant="body1" sx={{ textAlign: 'center', gridColumn: '1 / -1' }}>
                No tags found. Create your first tag!
              </Typography>
            ) : (
              tags.map((tag) => (
                <Card key={tag.id} sx={{ height: 'fit-content' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Chip
                        label={tag.name}
                        color="primary"
                        variant="outlined"
                        sx={{ backgroundColor: tag.color, color: 'white' }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Color: {tag.color}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
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
                      onClick={() => openDeleteConfirm(tag)}
                    >
                      Delete
                    </Button>
                  </CardActions>
                </Card>
              ))
            )}
          </Box>
        )}

        {/* Create Tag Modal */}
        <CreateTagModal
          open={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateTag}
        />

        {/* Edit Tag Modal */}
        <EditTagModal
          open={isEditModalOpen}
          tag={editingTag}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingTag(null);
          }}
          onSubmit={(tagData) => editingTag && handleUpdateTag(editingTag.id, tagData)}
        />

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={!!deleteConfirmTag}
          onClose={() => setDeleteConfirmTag(null)}
        >
          <DialogTitle>Delete Tag</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete the tag "{deleteConfirmTag?.name}"?
              This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteConfirmTag(null)}>Cancel</Button>
            <Button
              onClick={() => deleteConfirmTag && handleDeleteTag(deleteConfirmTag.id)}
              color="error"
              variant="contained"
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

// Create Tag Modal Component
interface CreateTagModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (tagData: CreateTagRequest) => void;
}

const CreateTagModal: React.FC<CreateTagModalProps> = ({ open, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#2196f3');

  const handleSubmit = () => {
    if (name.trim()) {
      onSubmit({
        name: name.trim(),
        color: color,
      });
      setName('');
      setColor('#2196f3');
    }
  };

  const handleClose = () => {
    setName('');
    setColor('#2196f3');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Tag</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Tag Name"
          fullWidth
          variant="outlined"
          value={name}
          onChange={(e) => setName(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          margin="dense"
          label="Color"
          type="color"
          fullWidth
          variant="outlined"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!name.trim()}
        >
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Edit Tag Modal Component
interface EditTagModalProps {
  open: boolean;
  tag: Tag | null;
  onClose: () => void;
  onSubmit: (tagData: UpdateTagRequest) => void;
}

const EditTagModal: React.FC<EditTagModalProps> = ({ open, tag, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#2196f3');

  useEffect(() => {
    if (tag) {
      setName(tag.name);
      setColor(tag.color);
    }
  }, [tag]);

  const handleSubmit = () => {
    if (name.trim()) {
      onSubmit({
        name: name.trim(),
        color: color,
      });
    }
  };

  const handleClose = () => {
    setName('');
    setColor('#2196f3');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Tag</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Tag Name"
          fullWidth
          variant="outlined"
          value={name}
          onChange={(e) => setName(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          margin="dense"
          label="Color"
          type="color"
          fullWidth
          variant="outlined"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!name.trim()}
        >
          Update
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdminTagsPage;