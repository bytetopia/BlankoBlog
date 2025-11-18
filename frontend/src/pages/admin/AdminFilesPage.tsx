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
  CircularProgress,
  Alert,
  IconButton,
  Chip,
} from '@mui/material';
import { Edit, Delete, InsertDriveFile } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { filesAPI } from '../../services/api';
import type { UploadedFile } from '../../services/api';
import AdminNavbar from '../../components/AdminNavbar';

const AdminFilesPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  useDocumentTitle('Manage Files');
  
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [totalFiles, setTotalFiles] = useState(0);
  
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

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
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
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1">
            Files Management
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
                            onClick={() => navigate(`/files/${file.id}`)}
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
