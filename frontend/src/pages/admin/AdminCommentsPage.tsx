import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Pagination,
  Tooltip,
} from '@mui/material';
import { 
  Visibility, 
  Delete, 
  CheckCircle, 
  Cancel, 
  AccessTime,
  Person,
  Email,
  Computer,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { commentsAPI } from '../../services/api';
import type { CommentAdmin, CommentStats, UpdateCommentStatusRequest } from '../../services/api';
import AdminNavbar from '../../components/AdminNavbar';

const AdminCommentsPage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  useDocumentTitle('Manage Comments');
  
  const [comments, setComments] = useState<CommentAdmin[]>([]);
  const [stats, setStats] = useState<CommentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedComment, setSelectedComment] = useState<CommentAdmin | null>(null);
  const [deleteConfirmComment, setDeleteConfirmComment] = useState<CommentAdmin | null>(null);
  
  // Pagination and filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [pageSize] = useState(20);

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
              You must be an admin to manage comments.
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  }

  const fetchComments = async (page = 1, status = 'all') => {
    try {
      setLoading(true);
      const response = await commentsAPI.getAllCommentsForAdmin(page, pageSize, status === 'all' ? undefined : status);
      setComments(response.data.comments);
      setCurrentPage(response.data.pagination.current_page);
      setTotalPages(response.data.pagination.total_pages);
    } catch (err) {
      setError('Failed to fetch comments');
      console.error('Error fetching comments:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await commentsAPI.getCommentStats();
      setStats(response.data.stats);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  useEffect(() => {
    fetchComments(currentPage, statusFilter);
    fetchStats();
  }, [currentPage, statusFilter]);

  const handleStatusChange = async (commentId: number, newStatus: 'pending' | 'approved' | 'hidden') => {
    try {
      const updateData: UpdateCommentStatusRequest = { status: newStatus };
      await commentsAPI.updateCommentStatus(commentId, updateData);
      await fetchComments(currentPage, statusFilter);
      await fetchStats();
      setSelectedComment(null);
    } catch (err) {
      setError('Failed to update comment status');
      console.error('Error updating comment status:', err);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      await commentsAPI.deleteComment(commentId);
      await fetchComments(currentPage, statusFilter);
      await fetchStats();
      setDeleteConfirmComment(null);
    } catch (err) {
      setError('Failed to delete comment');
      console.error('Error deleting comment:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'hidden': return 'error';
      default: return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Box>
      <AdminNavbar />
      <Box sx={{ p: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h4" component="h1">
            Manage Comments
          </Typography>
        </Box>

        {/* Statistics */}
        {stats && (
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 2,
            mb: 4
          }}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {stats.total}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Comments
                </Typography>
              </CardContent>
            </Card>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main">
                  {stats.pending}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pending
                </Typography>
              </CardContent>
            </Card>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  {stats.approved}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Approved
                </Typography>
              </CardContent>
            </Card>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="error.main">
                  {stats.hidden}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Hidden
                </Typography>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Filter */}
        <Box sx={{ mb: 3 }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status Filter</InputLabel>
            <Select
              value={statusFilter}
              label="Status Filter"
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <MenuItem value="all">All Comments</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="hidden">Hidden</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" mt={4}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {comments.length === 0 ? (
              <Typography variant="h6" textAlign="center" mt={4} color="text.secondary">
                No comments found.
              </Typography>
            ) : (
              <Box>
                {comments.map((comment) => (
                  <Card key={comment.id} sx={{ mb: 2 }}>
                    <CardContent>
                      {/* Header with status and actions */}
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Chip
                            label={comment.status.toUpperCase()}
                            color={getStatusColor(comment.status) as any}
                            size="small"
                          />
                          <Typography variant="body2" color="text.secondary">
                            #{comment.id}
                          </Typography>
                        </Box>
                        <Box>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => setSelectedComment(comment)}
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Approve">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleStatusChange(comment.id, 'approved')}
                              disabled={comment.status === 'approved'}
                            >
                              <CheckCircle />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Hide">
                            <IconButton
                              size="small"
                              color="warning"
                              onClick={() => handleStatusChange(comment.id, 'hidden')}
                              disabled={comment.status === 'hidden'}
                            >
                              <Cancel />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => setDeleteConfirmComment(comment)}
                            >
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>

                      {/* Comment content */}
                      <Box display="flex" alignItems="center" mb={1}>
                        <Person fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="subtitle1" fontWeight="bold">
                          {comment.name}
                        </Typography>
                        {comment.email && (
                          <>
                            <Email fontSize="small" sx={{ ml: 2, mr: 1, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              {comment.email}
                            </Typography>
                          </>
                        )}
                      </Box>

                      {comment.post_title && (
                        <Typography variant="body2" color="text.secondary" mb={1}>
                          On post: <strong>{comment.post_title}</strong>
                        </Typography>
                      )}

                      <Typography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
                        {comment.content}
                      </Typography>

                      <Box display="flex" alignItems="center" gap={2}>
                        <Box display="flex" alignItems="center">
                          <AccessTime fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(comment.created_at)}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center">
                          <Computer fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">
                            {comment.ip_address}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <Box display="flex" justifyContent="center" mt={4}>
                    <Pagination
                      count={totalPages}
                      page={currentPage}
                      onChange={(_, page) => setCurrentPage(page)}
                      color="primary"
                    />
                  </Box>
                )}
              </Box>
            )}
          </>
        )}

        {/* Comment Details Modal */}
        <Dialog
          open={!!selectedComment}
          onClose={() => setSelectedComment(null)}
          maxWidth="md"
          fullWidth
        >
          {selectedComment && (
            <>
              <DialogTitle>
                Comment Details #{selectedComment.id}
              </DialogTitle>
              <DialogContent>
                <Box mb={2}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={selectedComment.status.toUpperCase()}
                    color={getStatusColor(selectedComment.status) as any}
                    size="small"
                  />
                </Box>

                <Box mb={2}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Name
                  </Typography>
                  <Typography variant="body1">{selectedComment.name}</Typography>
                </Box>

                {selectedComment.email && (
                  <Box mb={2}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Email
                    </Typography>
                    <Typography variant="body1">{selectedComment.email}</Typography>
                  </Box>
                )}

                {selectedComment.post_title && (
                  <Box mb={2}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Post
                    </Typography>
                    <Typography variant="body1">{selectedComment.post_title}</Typography>
                  </Box>
                )}

                <Box mb={2}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Content
                  </Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {selectedComment.content}
                  </Typography>
                </Box>

                <Box mb={2}>
                  <Typography variant="subtitle2" color="text.secondary">
                    IP Address
                  </Typography>
                  <Typography variant="body1">{selectedComment.ip_address}</Typography>
                </Box>

                {selectedComment.referer && (
                  <Box mb={2}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Referer
                    </Typography>
                    <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
                      {selectedComment.referer}
                    </Typography>
                  </Box>
                )}

                <Box mb={2}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Created At
                  </Typography>
                  <Typography variant="body1">{formatDate(selectedComment.created_at)}</Typography>
                </Box>

                {selectedComment.updated_at !== selectedComment.created_at && (
                  <Box mb={2}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Updated At
                    </Typography>
                    <Typography variant="body1">{formatDate(selectedComment.updated_at)}</Typography>
                  </Box>
                )}
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setSelectedComment(null)}>Close</Button>
                <Button
                  color="success"
                  onClick={() => handleStatusChange(selectedComment.id, 'approved')}
                  disabled={selectedComment.status === 'approved'}
                >
                  Approve
                </Button>
                <Button
                  color="warning"
                  onClick={() => handleStatusChange(selectedComment.id, 'hidden')}
                  disabled={selectedComment.status === 'hidden'}
                >
                  Hide
                </Button>
                <Button
                  color="error"
                  onClick={() => {
                    setDeleteConfirmComment(selectedComment);
                    setSelectedComment(null);
                  }}
                >
                  Delete
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={!!deleteConfirmComment}
          onClose={() => setDeleteConfirmComment(null)}
        >
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete this comment? This action cannot be undone.
            </Typography>
            {deleteConfirmComment && (
              <Box mt={2} p={2} sx={{ bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="body2">
                  <strong>From:</strong> {deleteConfirmComment.name}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {deleteConfirmComment.content.length > 100 
                    ? `${deleteConfirmComment.content.substring(0, 100)}...`
                    : deleteConfirmComment.content
                  }
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteConfirmComment(null)}>Cancel</Button>
            <Button
              color="error"
              variant="contained"
              onClick={() => deleteConfirmComment && handleDeleteComment(deleteConfirmComment.id)}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default AdminCommentsPage;