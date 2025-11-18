package handlers

import (
	"net"
	"net/http"
	"strconv"
	"strings"

	"github.com/bytetopia/BlankoBlog/backend/internal/models"
	"github.com/bytetopia/BlankoBlog/backend/internal/services"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

type CommentHandler struct {
	commentService *services.CommentService
	validator      *validator.Validate
}

func NewCommentHandler(commentService *services.CommentService) *CommentHandler {
	return &CommentHandler{
		commentService: commentService,
		validator:      validator.New(),
	}
}

// getClientIP extracts the client IP address from the request
func (h *CommentHandler) getClientIP(c *gin.Context) string {
	// Check X-Forwarded-For header first (for proxies)
	if xff := c.GetHeader("X-Forwarded-For"); xff != "" {
		// Take the first IP from the list
		ips := strings.Split(xff, ",")
		if len(ips) > 0 {
			return strings.TrimSpace(ips[0])
		}
	}

	// Check X-Real-IP header
	if xri := c.GetHeader("X-Real-IP"); xri != "" {
		return xri
	}

	// Fall back to RemoteAddr
	ip, _, err := net.SplitHostPort(c.Request.RemoteAddr)
	if err != nil {
		return c.Request.RemoteAddr
	}
	return ip
}

// GetAllCommentsForAdmin retrieves all comments for admin management (admin endpoint)
// GET /api/admin/comments
func (h *CommentHandler) GetAllCommentsForAdmin(c *gin.Context) {
	// Parse pagination parameters
	pageParam := c.DefaultQuery("page", "1")
	limitParam := c.DefaultQuery("limit", "20")
	status := c.Query("status") // Optional filter by status

	page, err := strconv.Atoi(pageParam)
	if err != nil || page < 1 {
		page = 1
	}

	limit, err := strconv.Atoi(limitParam)
	if err != nil || limit < 1 || limit > 100 {
		limit = 20
	}

	comments, totalCount, err := h.commentService.GetAllCommentsForAdmin(page, limit, status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch comments"})
		return
	}

	// Convert to admin response format
	commentResponses := make([]models.CommentAdminResponse, len(comments))
	for i, comment := range comments {
		commentResponses[i] = comment.ToAdminResponse()
	}

	// Calculate pagination info
	totalPages := (int(totalCount) + limit - 1) / limit

	c.JSON(http.StatusOK, gin.H{
		"comments": commentResponses,
		"pagination": gin.H{
			"current_page":  page,
			"total_pages":   totalPages,
			"total_count":   totalCount,
			"limit":         limit,
		},
	})
}

// GetCommentForAdmin retrieves a specific comment for admin (admin endpoint)
// GET /api/admin/comments/:id
func (h *CommentHandler) GetCommentForAdmin(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid comment ID"})
		return
	}

	comment, err := h.commentService.GetCommentByID(uint(id))
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			c.JSON(http.StatusNotFound, gin.H{"error": "Comment not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch comment"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"comment": comment.ToAdminResponse()})
}

// UpdateCommentStatus updates the status of a comment (admin endpoint)
// PUT /api/admin/comments/:id/status
func (h *CommentHandler) UpdateCommentStatus(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid comment ID"})
		return
	}

	var req models.UpdateCommentStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}

	// Validate request
	if err := h.validator.Struct(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update status
	if err := h.commentService.UpdateCommentStatus(uint(id), req.Status); err != nil {
		if strings.Contains(err.Error(), "not found") {
			c.JSON(http.StatusNotFound, gin.H{"error": "Comment not found"})
			return
		}
		if strings.Contains(err.Error(), "invalid status") {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update comment status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Comment status updated successfully"})
}

// DeleteComment deletes a comment (admin endpoint)
// DELETE /api/admin/comments/:id
func (h *CommentHandler) DeleteComment(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid comment ID"})
		return
	}

	if err := h.commentService.DeleteComment(uint(id)); err != nil {
		if strings.Contains(err.Error(), "not found") {
			c.JSON(http.StatusNotFound, gin.H{"error": "Comment not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete comment"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Comment deleted successfully"})
}

// GetCommentStats returns statistics about comments (admin endpoint)
// GET /api/admin/comments/stats
func (h *CommentHandler) GetCommentStats(c *gin.Context) {
	stats, err := h.commentService.GetCommentStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch comment statistics"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"stats": stats})
}