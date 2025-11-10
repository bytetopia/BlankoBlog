package handlers

import (
	"net/http"
	"strconv"

	"github.com/bytetopia/BlankoBlog/backend/internal/models"
	"github.com/bytetopia/BlankoBlog/backend/internal/services"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

type TagHandler struct {
	tagService *services.TagService
	validator  *validator.Validate
}

func NewTagHandler(tagService *services.TagService) *TagHandler {
	return &TagHandler{
		tagService: tagService,
		validator:  validator.New(),
	}
}

// GetAllTags retrieves all tags
// GET /api/tags
func (h *TagHandler) GetAllTags(c *gin.Context) {
	tags, err := h.tagService.GetAllTags()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch tags"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"tags": tags})
}

// GetTag retrieves a specific tag by ID
// GET /api/tags/:id
func (h *TagHandler) GetTag(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid tag ID"})
		return
	}

	tag, err := h.tagService.GetTagByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Tag not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"tag": tag})
}

// CreateTag creates a new tag
// POST /api/tags
func (h *TagHandler) CreateTag(c *gin.Context) {
	var req models.CreateTagRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Validate request
	if err := h.validator.Struct(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Validation failed", "details": err.Error()})
		return
	}

	tag, err := h.tagService.CreateTag(req)
	if err != nil {
		if err.Error() == "tag with name '"+req.Name+"' already exists" {
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create tag"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"tag": tag})
}

// UpdateTag updates an existing tag
// PUT /api/tags/:id
func (h *TagHandler) UpdateTag(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid tag ID"})
		return
	}

	var req models.UpdateTagRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Validate request
	if err := h.validator.Struct(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Validation failed", "details": err.Error()})
		return
	}

	tag, err := h.tagService.UpdateTag(uint(id), req)
	if err != nil {
		if err.Error() == "tag with ID "+idParam+" not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		if err.Error() == "tag with name '"+*req.Name+"' already exists" {
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update tag"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"tag": tag})
}

// DeleteTag deletes a tag
// DELETE /api/tags/:id
func (h *TagHandler) DeleteTag(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid tag ID"})
		return
	}

	err = h.tagService.DeleteTag(uint(id))
	if err != nil {
		if err.Error() == "tag with ID "+idParam+" not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete tag"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Tag deleted successfully"})
}