import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  IconButton,
  List,
  ListItem,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Chip,
  Tooltip,
} from '@mui/material'
import {
  CloudUpload,
  Delete,
  Edit,
  AttachFile,
  ContentCopy,
} from '@mui/icons-material'
import { filesAPI, type UploadedFile } from '../services/api'

interface PostFileUploaderProps {
  postId: number | null
  onFilesChange?: (files: UploadedFile[]) => void
}

const PostFileUploader: React.FC<PostFileUploaderProps> = ({ postId, onFilesChange }) => {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [description, setDescription] = useState('')
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingFile, setEditingFile] = useState<UploadedFile | null>(null)

  // Load files for this post
  useEffect(() => {
    if (postId) {
      loadFiles()
    }
  }, [postId])

  const loadFiles = async () => {
    if (!postId) return

    try {
      setLoading(true)
      setError('')
      const response = await filesAPI.getFiles(1, 100)
      // Filter files for this specific post
      const postFiles = response.data.files.filter(f => f.post_id === postId)
      setFiles(postFiles)
      onFilesChange?.(postFiles)
    } catch (err) {
      console.error('Error loading files:', err)
      setError('Failed to load files')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setDisplayName(file.name)
      setDescription('')
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !postId) return

    try {
      setUploading(true)
      setError('')
      setSuccess('')

      await filesAPI.uploadFile(postId, selectedFile, displayName, description)
      
      setSuccess('File uploaded successfully!')
      setSelectedFile(null)
      setDisplayName('')
      setDescription('')
      
      // Reload files
      await loadFiles()
      
      // Reset file input
      const fileInput = document.getElementById('file-upload-input') as HTMLInputElement
      if (fileInput) {
        fileInput.value = ''
      }
    } catch (err: any) {
      console.error('Error uploading file:', err)
      setError(err.response?.data?.error || 'Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (fileId: number) => {
    if (!confirm('Are you sure you want to delete this file?')) return

    try {
      setError('')
      await filesAPI.deleteFile(fileId)
      setSuccess('File deleted successfully!')
      await loadFiles()
    } catch (err) {
      console.error('Error deleting file:', err)
      setError('Failed to delete file')
    }
  }

  const handleEdit = (file: UploadedFile) => {
    setEditingFile(file)
    setDisplayName(file.display_name)
    setDescription(file.description)
    setEditDialogOpen(true)
  }

  const handleUpdateFile = async () => {
    if (!editingFile) return

    try {
      setError('')
      await filesAPI.updateFile(editingFile.id, {
        display_name: displayName,
        description: description,
      })
      setSuccess('File updated successfully!')
      setEditDialogOpen(false)
      setEditingFile(null)
      await loadFiles()
    } catch (err) {
      console.error('Error updating file:', err)
      setError('Failed to update file')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setSuccess('Copied to clipboard!')
    setTimeout(() => setSuccess(''), 2000)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const getFileUrl = (file: UploadedFile): string => {
    return filesAPI.getFileUrl(file.server_path)
  }

  const isImageFile = (mimeType: string): boolean => {
    return mimeType.startsWith('image/')
  }

  const getMarkdownFormat = (file: UploadedFile): string => {
    const url = getFileUrl(file)
    if (isImageFile(file.mime_type)) {
      return `![${file.display_name}](${url})`
    }
    return `[${file.display_name}](${url})`
  }

  if (!postId) {
    return (
      <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Save the post first to upload files
        </Typography>
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
        Attached Files
      </Typography>

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

      {/* Upload new file */}
      <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
        <input
          accept="*/*"
          style={{ display: 'none' }}
          id="file-upload-input"
          type="file"
          onChange={handleFileSelect}
        />
        <label htmlFor="file-upload-input">
          <Button
            variant="outlined"
            component="span"
            startIcon={<AttachFile />}
            fullWidth
            size="small"
            disabled={uploading}
          >
            Choose File
          </Button>
        </label>

        {selectedFile && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
            </Typography>
            
            <TextField
              fullWidth
              size="small"
              label="Display Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              sx={{ mb: 1 }}
            />
            
            <TextField
              fullWidth
              size="small"
              label="Description (Optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              multiline
              rows={2}
              sx={{ mb: 1 }}
            />
            
            <Button
              variant="contained"
              startIcon={uploading ? <CircularProgress size={16} /> : <CloudUpload />}
              onClick={handleUpload}
              disabled={uploading || !displayName.trim()}
              fullWidth
              size="small"
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
          </Box>
        )}
      </Box>

      {/* Files list */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={24} />
        </Box>
      ) : files.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
          No files attached yet
        </Typography>
      ) : (
        <List dense disablePadding>
          {files.map((file) => (
            <ListItem
              key={file.id}
              sx={{
                bgcolor: 'background.paper',
                mb: 0.75,
                borderRadius: 0.5,
                border: '1px solid',
                borderColor: 'divider',
                flexDirection: 'column',
                alignItems: 'flex-start',
                p: 1,
                gap: 0.75,
              }}
            >
              {/* Header with name and actions */}
              <Box sx={{ width: '100%', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8125rem', lineHeight: 1.3, flex: 1, wordBreak: 'break-word' }}>
                  {file.display_name}
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.25, flexShrink: 0 }}>
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => handleEdit(file)} sx={{ p: 0.5 }}>
                      <Edit sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" onClick={() => handleDelete(file.id)} color="error" sx={{ p: 0.5 }}>
                      <Delete sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
              
              {/* Description */}
              {file.description && (
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', lineHeight: 1.2, width: '100%' }}>
                  {file.description}
                </Typography>
              )}
              
              {/* Metadata chips */}
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', width: '100%' }}>
                <Chip label={formatFileSize(file.file_size)} size="small" sx={{ height: 18, fontSize: '0.7rem', '& .MuiChip-label': { px: 0.75, py: 0 } }} />
                <Chip label={file.mime_type.split('/')[1] || file.mime_type} size="small" sx={{ height: 18, fontSize: '0.7rem', '& .MuiChip-label': { px: 0.75, py: 0 } }} />
              </Box>
              
              {/* Action buttons */}
              <Box sx={{ width: '100%', display: 'flex', gap: 0.5 }}>
                <Button
                  size="small"
                  startIcon={<ContentCopy sx={{ fontSize: 14 }} />}
                  onClick={() => copyToClipboard(getFileUrl(file))}
                  fullWidth
                  variant="outlined"
                  sx={{ py: 0.25, fontSize: '0.7rem', minHeight: 24 }}
                >
                  URL
                </Button>
                <Button
                  size="small"
                  startIcon={<ContentCopy sx={{ fontSize: 14 }} />}
                  onClick={() => copyToClipboard(getMarkdownFormat(file))}
                  fullWidth
                  variant="outlined"
                  sx={{ py: 0.25, fontSize: '0.7rem', minHeight: 24 }}
                >
                  MD
                </Button>
              </Box>
            </ListItem>
          ))}
        </List>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit File Metadata</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Display Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            sx={{ mt: 2, mb: 2 }}
          />
          <TextField
            fullWidth
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateFile} variant="contained" disabled={!displayName.trim()}>
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default PostFileUploader
