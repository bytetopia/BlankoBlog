package services

import (
	"fmt"
	"strings"
	"unicode"

	"github.com/bytetopia/BlankoBlog/backend/internal/models"
	"gorm.io/gorm"
)

type PostService struct {
	db *gorm.DB
}

func NewPostService(db *gorm.DB) *PostService {
	return &PostService{db: db}
}

// GetPosts retrieves posts with pagination
func (s *PostService) GetPosts(page, limit int, publishedOnly bool) ([]models.Post, int64, error) {
	var posts []models.Post
	var total int64

	query := s.db.Model(&models.Post{})
	if publishedOnly {
		query = query.Where("published = ?", true)
	}

	// Count total
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get posts with pagination
	offset := (page - 1) * limit
	if err := query.Order("created_at DESC").Offset(offset).Limit(limit).Find(&posts).Error; err != nil {
		return nil, 0, err
	}

	return posts, total, nil
}

// GetPostByID retrieves a post by ID
func (s *PostService) GetPostByID(id uint, publishedOnly bool) (*models.Post, error) {
	var post models.Post
	query := s.db

	if publishedOnly {
		query = query.Where("published = ?", true)
	}

	if err := query.First(&post, id).Error; err != nil {
		return nil, err
	}

	return &post, nil
}

// GetPostBySlug retrieves a post by slug
func (s *PostService) GetPostBySlug(slug string, publishedOnly bool) (*models.Post, error) {
	var post models.Post
	query := s.db.Where("slug = ?", slug)

	if publishedOnly {
		query = query.Where("published = ?", true)
	}

	if err := query.First(&post).Error; err != nil {
		return nil, err
	}

	return &post, nil
}

// CreatePost creates a new blog post
func (s *PostService) CreatePost(req models.CreatePostRequest) (*models.Post, error) {
	slug := generateSlug(req.Title)
	
	// Check if slug already exists
	var existingPost models.Post
	if err := s.db.Where("slug = ?", slug).First(&existingPost).Error; err == nil {
		return nil, fmt.Errorf("slug already exists")
	}

	post := models.Post{
		Title:     req.Title,
		Content:   req.Content,
		Summary:   req.Summary,
		Slug:      slug,
		Published: req.Published,
	}

	if err := s.db.Create(&post).Error; err != nil {
		return nil, err
	}

	return &post, nil
}

// UpdatePost updates an existing blog post
func (s *PostService) UpdatePost(id uint, req models.UpdatePostRequest) (*models.Post, error) {
	var post models.Post
	if err := s.db.First(&post, id).Error; err != nil {
		return nil, err
	}

	// Update fields if provided
	if req.Title != nil {
		post.Title = *req.Title
		post.Slug = generateSlug(*req.Title)
	}
	if req.Content != nil {
		post.Content = *req.Content
	}
	if req.Summary != nil {
		post.Summary = *req.Summary
	}
	if req.Published != nil {
		post.Published = *req.Published
	}

	if err := s.db.Save(&post).Error; err != nil {
		return nil, err
	}

	return &post, nil
}

// DeletePost soft deletes a blog post
func (s *PostService) DeletePost(id uint) error {
	var post models.Post
	if err := s.db.First(&post, id).Error; err != nil {
		return err
	}

	return s.db.Delete(&post).Error
}

// generateSlug creates a URL-friendly slug from a title
func generateSlug(title string) string {
	// Convert to lowercase
	slug := strings.ToLower(title)
	
	// Replace spaces and special characters with hyphens
	var result strings.Builder
	for _, r := range slug {
		if unicode.IsLetter(r) || unicode.IsDigit(r) {
			result.WriteRune(r)
		} else if unicode.IsSpace(r) || r == '-' || r == '_' {
			result.WriteRune('-')
		}
	}
	
	// Clean up multiple hyphens
	slug = strings.ReplaceAll(result.String(), "--", "-")
	slug = strings.Trim(slug, "-")
	
	// Limit length
	if len(slug) > 100 {
		slug = slug[:100]
		slug = strings.Trim(slug, "-")
	}
	
	return slug
}