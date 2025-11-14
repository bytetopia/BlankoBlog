package handlers

import (
	"net/http"
	"strconv"

	"github.com/bytetopia/BlankoBlog/backend/internal/models"
	"github.com/bytetopia/BlankoBlog/backend/internal/services"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type FileHandler struct {
	fileService *services.FileService
}

func NewFileHandler(db *gorm.DB) *FileHandler {
	return &FileHandler{
		fileService: services.NewFileService(db),
	}
}

// UploadFile handles POST /api/files
func (h *FileHandler) UploadFile(c *gin.Context) {
	// Get post_id from form
	postIDStr := c.PostForm("post_id")
	if postIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "post_id is required"})
		return
	}
	
	postID, err := strconv.ParseUint(postIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid post_id"})
		return
	}
	
	// Get the file from the request
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File is required"})
		return
	}
	defer file.Close()
	
	// Get optional display name and description
	displayName := c.PostForm("display_name")
	if displayName == "" {
		displayName = header.Filename
	}
	description := c.PostForm("description")
	
	// Save file to disk
	serverPath, fileSize, mimeType, err := h.fileService.SaveUploadedFile(file, header)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file: " + err.Error()})
		return
	}
	
	// Create file record in database
	fileRecord := &models.File{
		PostID:           uint(postID),
		OriginalFileName: header.Filename,
		DisplayName:      displayName,
		Description:      description,
		ServerPath:       serverPath,
		FileSize:         fileSize,
		MimeType:         mimeType,
	}
	
	if err := h.fileService.CreateFile(fileRecord); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create file record"})
		return
	}
	
	// Return the created file
	createdFile, err := h.fileService.GetFile(fileRecord.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve created file"})
		return
	}
	
	c.JSON(http.StatusCreated, createdFile.ToResponse())
}

// GetFiles handles GET /api/files
func (h *FileHandler) GetFiles(c *gin.Context) {
	// Parse query parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	
	// Get files with pagination
	files, total, err := h.fileService.GetFiles(page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch files"})
		return
	}
	
	// Convert to response format
	fileResponses := make([]models.FileResponse, 0, len(files))
	for _, file := range files {
		fileResponses = append(fileResponses, file.ToResponse())
	}
	
	c.JSON(http.StatusOK, gin.H{
		"files": fileResponses,
		"pagination": gin.H{
			"page":        page,
			"limit":       limit,
			"total":       total,
			"total_pages": (total + int64(limit) - 1) / int64(limit),
		},
	})
}

// GetFile handles GET /api/files/:id
func (h *FileHandler) GetFile(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid file ID"})
		return
	}
	
	file, err := h.fileService.GetFile(uint(id))
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "File not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch file"})
		return
	}
	
	c.JSON(http.StatusOK, file.ToResponse())
}

// UpdateFile handles PUT /api/files/:id
func (h *FileHandler) UpdateFile(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid file ID"})
		return
	}
	
	var req models.UpdateFileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}
	
	file, err := h.fileService.UpdateFile(uint(id), &req)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "File not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update file"})
		return
	}
	
	c.JSON(http.StatusOK, file.ToResponse())
}

// DeleteFile handles DELETE /api/files/:id
func (h *FileHandler) DeleteFile(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid file ID"})
		return
	}
	
	if err := h.fileService.DeleteFile(uint(id)); err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "File not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete file"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"message": "File deleted successfully"})
}

// ServeFile handles GET /uploads/*filepath
func (h *FileHandler) ServeFile(c *gin.Context) {
	// Get the file path from the URL (everything after /uploads/)
	filepath := c.Param("filepath")
	if filepath == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File path is required"})
		return
	}
	
	// Remove leading slash if present
	if filepath[0] == '/' {
		filepath = filepath[1:]
	}
	
	// Get the full path on disk
	fullPath := h.fileService.GetFullPath(filepath)
	
	// Serve the file
	c.File(fullPath)
}
