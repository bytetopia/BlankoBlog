import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  CardMedia,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Stack,
} from '@mui/material';
import { Save, Delete, ArrowBack, InsertDriveFile, Download } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { filesAPI } from '../../services/api';
import type { UploadedFile, UpdateFileRequest } from '../../services/api';
import AdminNavbar from '../../components/AdminNavbar';

const AdminFileEditorPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, user } = useAuth();
  useDocumentTitle('Edit File');
  
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form fields
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  
  // Delete confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

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
              You must be an admin to edit files.
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  }

  useEffect(() => {
    if (id) {
      loadFile();
    }
  }, [id]);

  const loadFile = async () => {
    try {
      setLoading(true);
      const response = await filesAPI.getFile(parseInt(id!));
      const fileData = response.data;
      setFile(fileData);
      setDisplayName(fileData.display_name);
      setDescription(fileData.description);
    } catch (err) {
      setError('Failed to load file');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!file) return;

    try {
      setSaving(true);
      setError('');
      
      const updates: UpdateFileRequest = {};
      if (displayName !== file.display_name) {
        updates.display_name = displayName;
      }
      if (description !== file.description) {
        updates.description = description;
      }

      if (Object.keys(updates).length > 0) {
        await filesAPI.updateFile(file.id, updates);
        setSuccess('File updated successfully');
        await loadFile();
      } else {
        setSuccess('No changes to save');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update file');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!file) return;

    try {
      setError('');
      await filesAPI.deleteFile(file.id);
      setSuccess('File deleted successfully');
      setTimeout(() => navigate('/files'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete file');
      setDeleteConfirmOpen(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const isImage = (mimeType: string): boolean => {
    return mimeType.startsWith('image/');
  };

  if (loading) {
    return (
      <Box>
        <AdminNavbar />
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  if (!file) {
    return (
      <Box>
        <AdminNavbar />
        <Box sx={{ p: 4 }}>
          <Alert severity="error">File not found</Alert>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <AdminNavbar />
      <Box sx={{ px: 4, py: 4, maxWidth: 900, mx: 'auto' }}>
        <Box sx={{ mb: 4 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/files')}
            sx={{ mb: 2 }}
          >
            Back to Files
          </Button>
          <Typography variant="h4" component="h1" gutterBottom>
            Edit File
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        {/* File Preview Card */}
        <Card sx={{ mb: 3 }}>
          {isImage(file.mime_type) ? (
            <CardMedia
              component="img"
              image={filesAPI.getFileUrl(file.server_path)}
              alt={file.display_name}
              sx={{ maxHeight: 400, objectFit: 'contain', bgcolor: 'grey.100' }}
            />
          ) : (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: 200,
                bgcolor: 'grey.100',
              }}
            >
              <InsertDriveFile sx={{ fontSize: 80, color: 'grey.400' }} />
            </Box>
          )}
          <CardContent>
            <Stack spacing={1}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Original Filename
                </Typography>
                <Typography variant="body1">{file.original_file_name}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  File Type
                </Typography>
                <Typography variant="body2">{file.mime_type}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  File Size
                </Typography>
                <Typography variant="body2">{formatFileSize(file.file_size)}</Typography>
              </Box>
              {file.post_title && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Associated Post
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip label={file.post_title} size="small" />
                  </Box>
                </Box>
              )}
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Uploaded
                </Typography>
                <Typography variant="body2">
                  {new Date(file.created_at).toLocaleString()}
                </Typography>
              </Box>
              <Box>
                <Button
                  size="small"
                  startIcon={<Download />}
                  href={filesAPI.getFileUrl(file.server_path)}
                  download={file.original_file_name}
                  target="_blank"
                >
                  Download
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Edit Form */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              File Information
            </Typography>
            <Stack spacing={3}>
              <TextField
                label="Display Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                fullWidth
                required
                helperText="The name shown to users"
              />

              <TextField
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                multiline
                rows={4}
                fullWidth
                helperText="Optional description or notes about the file"
              />

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between' }}>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Delete />}
                  onClick={() => setDeleteConfirmOpen(true)}
                >
                  Delete File
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Save />}
                  onClick={handleSave}
                  disabled={saving || !displayName.trim()}
                >
                  {saving ? <CircularProgress size={24} /> : 'Save Changes'}
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
        >
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete "{file.display_name}"? This action cannot be undone
              and will also delete the physical file from the server.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
            <Button onClick={handleDelete} color="error" variant="contained">
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default AdminFileEditorPage;
