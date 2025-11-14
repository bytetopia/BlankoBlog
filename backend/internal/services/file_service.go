package services

import (
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"time"

	"github.com/bytetopia/BlankoBlog/backend/internal/models"
	"gorm.io/gorm"
)

type FileService struct {
	db *gorm.DB
}

func NewFileService(db *gorm.DB) *FileService {
	return &FileService{db: db}
}

// GetBaseUploadPath returns the base path for uploads (same directory as blog.db)
func (s *FileService) GetBaseUploadPath() string {
	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "./data/blog.db"
	}
	
	// Get the directory containing blog.db
	baseDir := filepath.Dir(dbPath)
	return filepath.Join(baseDir, "uploads")
}

// SaveUploadedFile saves a file to disk and returns the server path
func (s *FileService) SaveUploadedFile(file multipart.File, header *multipart.FileHeader) (string, int64, string, error) {
	// Generate timestamp-based filename to avoid conflicts
	timestamp := time.Now().UnixNano()
	ext := filepath.Ext(header.Filename)
	filename := fmt.Sprintf("%d%s", timestamp, ext)
	
	// Create directory structure: uploads/year/month/
	now := time.Now()
	yearMonth := filepath.Join(fmt.Sprintf("%d", now.Year()), fmt.Sprintf("%02d", now.Month()))
	uploadDir := filepath.Join(s.GetBaseUploadPath(), yearMonth)
	
	// Ensure directory exists
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		return "", 0, "", fmt.Errorf("failed to create upload directory: %w", err)
	}
	
	// Full server path
	serverPath := filepath.Join(yearMonth, filename)
	fullPath := filepath.Join(s.GetBaseUploadPath(), serverPath)
	
	// Create destination file
	dst, err := os.Create(fullPath)
	if err != nil {
		return "", 0, "", fmt.Errorf("failed to create file: %w", err)
	}
	defer dst.Close()
	
	// Copy file content
	fileSize, err := io.Copy(dst, file)
	if err != nil {
		os.Remove(fullPath) // Clean up on error
		return "", 0, "", fmt.Errorf("failed to save file: %w", err)
	}
	
	// Detect MIME type from header
	mimeType := header.Header.Get("Content-Type")
	if mimeType == "" {
		mimeType = "application/octet-stream"
	}
	
	return serverPath, fileSize, mimeType, nil
}

// CreateFile creates a new file record in the database
func (s *FileService) CreateFile(file *models.File) error {
	return s.db.Create(file).Error
}

// GetFile retrieves a file by ID with post information
func (s *FileService) GetFile(id uint) (*models.File, error) {
	var file models.File
	if err := s.db.Preload("Post").First(&file, id).Error; err != nil {
		return nil, err
	}
	return &file, nil
}

// GetFiles retrieves files with pagination
func (s *FileService) GetFiles(page, limit int) ([]models.File, int64, error) {
	var files []models.File
	var total int64
	
	query := s.db.Model(&models.File{})
	
	// Count total
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	
	// Get files with pagination and preload post info
	offset := (page - 1) * limit
	if err := query.Preload("Post").Order("created_at DESC").Offset(offset).Limit(limit).Find(&files).Error; err != nil {
		return nil, 0, err
	}
	
	return files, total, nil
}

// GetFilesByPost retrieves all files for a specific post
func (s *FileService) GetFilesByPost(postID uint) ([]models.File, error) {
	var files []models.File
	if err := s.db.Where("post_id = ?", postID).Order("created_at DESC").Find(&files).Error; err != nil {
		return nil, err
	}
	return files, nil
}

// UpdateFile updates file metadata (display name and description only)
func (s *FileService) UpdateFile(id uint, updates *models.UpdateFileRequest) (*models.File, error) {
	var file models.File
	if err := s.db.First(&file, id).Error; err != nil {
		return nil, err
	}
	
	// Update only the allowed fields
	updateMap := make(map[string]interface{})
	if updates.DisplayName != nil {
		updateMap["display_name"] = *updates.DisplayName
	}
	if updates.Description != nil {
		updateMap["description"] = *updates.Description
	}
	
	if len(updateMap) > 0 {
		if err := s.db.Model(&file).Updates(updateMap).Error; err != nil {
			return nil, err
		}
	}
	
	// Reload to get updated data
	if err := s.db.Preload("Post").First(&file, id).Error; err != nil {
		return nil, err
	}
	
	return &file, nil
}

// DeleteFile deletes a file record and the physical file
func (s *FileService) DeleteFile(id uint) error {
	var file models.File
	if err := s.db.First(&file, id).Error; err != nil {
		return err
	}
	
	// Delete physical file
	fullPath := filepath.Join(s.GetBaseUploadPath(), file.ServerPath)
	if err := os.Remove(fullPath); err != nil && !os.IsNotExist(err) {
		// Log error but don't fail the operation
		fmt.Printf("Warning: failed to delete physical file %s: %v\n", fullPath, err)
	}
	
	// Delete database record (soft delete)
	return s.db.Delete(&file).Error
}

// GetFullPath returns the full filesystem path for a file
func (s *FileService) GetFullPath(serverPath string) string {
	return filepath.Join(s.GetBaseUploadPath(), serverPath)
}
