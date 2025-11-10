package handlers

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/bytetopia/BlankoBlog/backend/internal/models"
	"github.com/bytetopia/BlankoBlog/backend/internal/services"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type PostHandler struct {
	postService *services.PostService
}

func NewPostHandler(db *gorm.DB) *PostHandler {
	return &PostHandler{
		postService: services.NewPostService(db),
	}
}

// GetPosts handles GET /api/posts
func (h *PostHandler) GetPosts(c *gin.Context) {
	// Parse query parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	publishedOnly := c.DefaultQuery("published", "true") == "true"

	posts, total, err := h.postService.GetPosts(page, limit, publishedOnly)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch posts"})
		return
	}

	// Convert to response format
	postResponses := make([]models.PostResponse, 0, len(posts))
	for _, post := range posts {
		postResponses = append(postResponses, post.ToResponse())
	}

	c.JSON(http.StatusOK, gin.H{
		"posts": postResponses,
		"pagination": gin.H{
			"page":       page,
			"limit":      limit,
			"total":      total,
			"total_pages": (total + int64(limit) - 1) / int64(limit),
		},
	})
}

// GetPost handles GET /api/posts/:id
func (h *PostHandler) GetPost(c *gin.Context) {
	idParam := c.Param("id")

	// Try to parse as ID first, then as slug
	if id, err := strconv.ParseUint(idParam, 10, 32); err == nil {
		post, err := h.postService.GetPostByID(uint(id), true)
		if err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "Post not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch post"})
			return
		}
		c.JSON(http.StatusOK, post.ToResponse())
		return
	}

	// Try as slug
	post, err := h.postService.GetPostBySlug(idParam, true)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Post not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch post"})
		return
	}

	c.JSON(http.StatusOK, post.ToResponse())
}

// CreatePost handles POST /api/posts (admin only)
func (h *PostHandler) CreatePost(c *gin.Context) {
	var req models.CreatePostRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	post, err := h.postService.CreatePost(req)
	if err != nil {
		if strings.Contains(err.Error(), "slug already exists") {
			c.JSON(http.StatusConflict, gin.H{"error": "A post with this title already exists"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create post"})
		return
	}

	c.JSON(http.StatusCreated, post.ToResponse())
}

// UpdatePost handles PUT /api/posts/:id (admin only)
func (h *PostHandler) UpdatePost(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid post ID"})
		return
	}

	var req models.UpdatePostRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	post, err := h.postService.UpdatePost(uint(id), req)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Post not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update post"})
		return
	}

	c.JSON(http.StatusOK, post.ToResponse())
}

// DeletePost handles DELETE /api/posts/:id (admin only)
func (h *PostHandler) DeletePost(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid post ID"})
		return
	}

	if err := h.postService.DeletePost(uint(id)); err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Post not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete post"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Post deleted successfully"})
}