import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  IconButton,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Edit, Delete, Upload, InsertDriveFile } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { filesAPI, postsAPI } from '../../services/api';
import type { UploadedFile, BlogPost } from '../../services/api';
import AdminNavbar from '../../components/AdminNavbar';

const AdminFilesPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  useDocumentTitle('Manage Files');
  
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [totalFiles, setTotalFiles] = useState(0);
  
  // Upload modal
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPostId, setUploadPostId] = useState<number | ''>('');
  const [uploadDisplayName, setUploadDisplayName] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  
  // Delete confirmation
  const [deleteConfirmFile, setDeleteConfirmFile] = useState<UploadedFile | null>(null);

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
              You must be an admin to manage files.
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  }

  useEffect(() => {
    loadFiles();
    loadPosts();
  }, [page, rowsPerPage]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const response = await filesAPI.getFiles(page + 1, rowsPerPage);
      setFiles(response.data.files);
      setTotalFiles(response.data.pagination.total);
    } catch (err) {
      setError('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async () => {
    try {
      const response = await postsAPI.getPosts(1, 1000, false); // Get all posts
      setPosts(response.data.posts);
    } catch (err) {
      console.error('Failed to load posts:', err);
    }
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setUploadFile(file);
      // Auto-fill display name with original filename
      if (!uploadDisplayName) {
        setUploadDisplayName(file.name);
      }
    }
  };

  const handleUpload = async () => {
    if (!uploadFile || !uploadPostId) {
      setError('Please select a file and post');
      return;
    }

    try {
      setUploading(true);
      setError('');
      await filesAPI.uploadFile(
        uploadPostId as number,
        uploadFile,
        uploadDisplayName || undefined,
        uploadDescription || undefined
      );
      setSuccess('File uploaded successfully');
      setIsUploadModalOpen(false);
      resetUploadForm();
      await loadFiles();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const resetUploadForm = () => {
    setUploadFile(null);
    setUploadPostId('');
    setUploadDisplayName('');
    setUploadDescription('');
  };

  const handleDelete = async (id: number) => {
    try {
      setError('');
      await filesAPI.deleteFile(id);
      setSuccess('File deleted successfully');
      setDeleteConfirmFile(null);
      await loadFiles();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete file');
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

  return (
    <Box>
      <AdminNavbar />
      <Box sx={{ px: 4, py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1">
            Files Management
          </Typography>
          <Button
            variant="contained"
            startIcon={<Upload />}
            onClick={() => setIsUploadModalOpen(true)}
          >
            Upload File
          </Button>
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

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell width="50px">Preview</TableCell>
                    <TableCell>Display Name</TableCell>
                    <TableCell>Original Filename</TableCell>
                    <TableCell>Post</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Size</TableCell>
                    <TableCell>Uploaded</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {files.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <Typography color="text.secondary" sx={{ py: 4 }}>
                          No files uploaded yet
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    files.map((file) => (
                      <TableRow key={file.id} hover>
                        <TableCell>
                          {isImage(file.mime_type) ? (
                            <Box
                              component="img"
                              src={filesAPI.getFileUrl(file.server_path)}
                              alt={file.display_name}
                              sx={{
                                width: 40,
                                height: 40,
                                objectFit: 'cover',
                                borderRadius: 1,
                              }}
                            />
                          ) : (
                            <InsertDriveFile color="action" />
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {file.display_name}
                          </Typography>
                          {file.description && (
                            <Typography variant="caption" color="text.secondary">
                              {file.description}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {file.original_file_name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {file.post_title && (
                            <Chip label={file.post_title} size="small" variant="outlined" />
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {file.mime_type}
                          </Typography>
                        </TableCell>
                        <TableCell>{formatFileSize(file.file_size)}</TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(file.created_at).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => navigate(`/admin/files/${file.id}`)}
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeleteConfirmFile(file)}
                          >
                            <Delete />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={totalFiles}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[10, 20, 50, 100]}
            />
          </>
        )}

        {/* Upload Dialog */}
        <Dialog
          open={isUploadModalOpen}
          onClose={() => {
            setIsUploadModalOpen(false);
            resetUploadForm();
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Upload File</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <FormControl fullWidth required>
                <InputLabel>Associated Post</InputLabel>
                <Select
                  value={uploadPostId}
                  onChange={(e) => setUploadPostId(e.target.value as number)}
                  label="Associated Post"
                >
                  {posts.map((post) => (
                    <MenuItem key={post.id} value={post.id}>
                      {post.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button
                variant="outlined"
                component="label"
                startIcon={<Upload />}
                fullWidth
              >
                {uploadFile ? uploadFile.name : 'Select File'}
                <input
                  type="file"
                  hidden
                  onChange={handleFileSelect}
                />
              </Button>

              {uploadFile && (
                <>
                  <TextField
                    label="Display Name"
                    value={uploadDisplayName}
                    onChange={(e) => setUploadDisplayName(e.target.value)}
                    fullWidth
                    helperText="Optional: Custom display name for the file"
                  />

                  <TextField
                    label="Description"
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    multiline
                    rows={3}
                    fullWidth
                    helperText="Optional: Description or notes about the file"
                  />
                </>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setIsUploadModalOpen(false);
                resetUploadForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              variant="contained"
              disabled={!uploadFile || !uploadPostId || uploading}
            >
              {uploading ? <CircularProgress size={24} /> : 'Upload'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteConfirmFile !== null}
          onClose={() => setDeleteConfirmFile(null)}
        >
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete the file "{deleteConfirmFile?.display_name}"?
              This action cannot be undone and will also delete the physical file from the server.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteConfirmFile(null)}>Cancel</Button>
            <Button
              onClick={() => deleteConfirmFile && handleDelete(deleteConfirmFile.id)}
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

export default AdminFilesPage;
