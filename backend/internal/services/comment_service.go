package services

import (
	"errors"
	"fmt"

	"github.com/bytetopia/BlankoBlog/backend/internal/models"
	"gorm.io/gorm"
)

type CommentService struct {
	db *gorm.DB
}

func NewCommentService(db *gorm.DB) *CommentService {
	return &CommentService{db: db}
}

// CreateComment creates a new comment
func (s *CommentService) CreateComment(comment *models.Comment) error {
	// Validate that the post exists and is published
	var post models.Post
	if err := s.db.Where("id = ? AND published = ?", comment.PostID, true).First(&post).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return fmt.Errorf("post with ID %d not found or not published", comment.PostID)
		}
		return fmt.Errorf("failed to validate post: %w", err)
	}

	// Set default status to pending
	if comment.Status == "" {
		comment.Status = "pending"
	}

	if err := s.db.Create(comment).Error; err != nil {
		return fmt.Errorf("failed to create comment: %w", err)
	}

	return nil
}

// GetCommentsByPostID retrieves approved comments for a specific post
func (s *CommentService) GetCommentsByPostID(postID uint) ([]models.Comment, error) {
	var comments []models.Comment
	if err := s.db.Where("post_id = ? AND status = ?", postID, "approved").
		Order("created_at ASC").
		Find(&comments).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch comments for post %d: %w", postID, err)
	}
	return comments, nil
}

// GetAllCommentsForAdmin retrieves all comments for admin management with post titles
func (s *CommentService) GetAllCommentsForAdmin(page, limit int, status string) ([]models.Comment, int64, error) {
	var comments []models.Comment
	var totalCount int64

	// Build query
	query := s.db.Model(&models.Comment{}).Preload("Post")

	// Filter by status if provided
	if status != "" && status != "all" {
		query = query.Where("status = ?", status)
	}

	// Get total count
	if err := query.Count(&totalCount).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count comments: %w", err)
	}

	// Get paginated results
	offset := (page - 1) * limit
	if err := query.Order("created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&comments).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to fetch comments: %w", err)
	}

	return comments, totalCount, nil
}

// GetCommentByID retrieves a comment by its ID (admin access)
func (s *CommentService) GetCommentByID(id uint) (*models.Comment, error) {
	var comment models.Comment
	if err := s.db.Preload("Post").First(&comment, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("comment with ID %d not found", id)
		}
		return nil, fmt.Errorf("failed to fetch comment: %w", err)
	}
	return &comment, nil
}

// UpdateCommentStatus updates the status of a comment
func (s *CommentService) UpdateCommentStatus(id uint, status string) error {
	// Validate status
	validStatuses := map[string]bool{
		"pending":  true,
		"approved": true,
		"hidden":   true,
	}

	if !validStatuses[status] {
		return fmt.Errorf("invalid status: %s", status)
	}

	result := s.db.Model(&models.Comment{}).Where("id = ?", id).Update("status", status)
	if result.Error != nil {
		return fmt.Errorf("failed to update comment status: %w", result.Error)
	}

	if result.RowsAffected == 0 {
		return fmt.Errorf("comment with ID %d not found", id)
	}

	return nil
}

// DeleteComment soft deletes a comment
func (s *CommentService) DeleteComment(id uint) error {
	result := s.db.Delete(&models.Comment{}, id)
	if result.Error != nil {
		return fmt.Errorf("failed to delete comment: %w", result.Error)
	}

	if result.RowsAffected == 0 {
		return fmt.Errorf("comment with ID %d not found", id)
	}

	return nil
}

// GetCommentStats returns statistics about comments
func (s *CommentService) GetCommentStats() (map[string]int64, error) {
	stats := make(map[string]int64)

	// Count by status
	statuses := []string{"pending", "approved", "hidden"}
	for _, status := range statuses {
		var count int64
		if err := s.db.Model(&models.Comment{}).Where("status = ?", status).Count(&count).Error; err != nil {
			return nil, fmt.Errorf("failed to count %s comments: %w", status, err)
		}
		stats[status] = count
	}

	// Total count
	var total int64
	if err := s.db.Model(&models.Comment{}).Count(&total).Error; err != nil {
		return nil, fmt.Errorf("failed to count total comments: %w", err)
	}
	stats["total"] = total

	return stats, nil
}