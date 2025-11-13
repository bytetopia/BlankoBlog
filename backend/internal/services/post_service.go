package services

import (
	"fmt"
	"strings"
	"unicode"

	"github.com/bytetopia/BlankoBlog/backend/internal/models"
	"gorm.io/gorm"
)

type PostService struct {
	db         *gorm.DB
	tagService *TagService
}

func NewPostService(db *gorm.DB) *PostService {
	return &PostService{
		db:         db,
		tagService: NewTagService(db),
	}
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

	// Get posts with pagination and preload tags
	offset := (page - 1) * limit
	if err := query.Preload("Tags").Order("created_at DESC").Offset(offset).Limit(limit).Find(&posts).Error; err != nil {
		return nil, 0, err
	}

	return posts, total, nil
}

// GetPostByID retrieves a post by ID
func (s *PostService) GetPostByID(id uint, publishedOnly bool) (*models.Post, error) {
	var post models.Post
	query := s.db.Preload("Tags")

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
	query := s.db.Preload("Tags").Where("slug = ?", slug)

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
	var slug string
	
	// Use user-provided slug if available, otherwise generate from title
	if req.Slug != "" {
		slug = sanitizeSlug(req.Slug)
	} else {
		slug = generateSlug(req.Title)
	}
	
	// Ensure slug is unique
	finalSlug, err := s.ensureUniqueSlug(slug)
	if err != nil {
		return nil, err
	}

	post := models.Post{
		Title:     req.Title,
		Content:   req.Content,
		Summary:   req.Summary,
		Slug:      finalSlug,
		Published: req.Published,
	}

	// Create post first
	if err := s.db.Create(&post).Error; err != nil {
		return nil, err
	}

	// Handle tags if provided
	if len(req.TagIDs) > 0 {
		tags, err := s.tagService.GetTagsByIDs(req.TagIDs)
		if err != nil {
			return nil, fmt.Errorf("failed to get tags: %w", err)
		}

		// Associate tags with the post
		if err := s.db.Model(&post).Association("Tags").Append(tags); err != nil {
			return nil, fmt.Errorf("failed to associate tags: %w", err)
		}

		// Reload post with tags
		if err := s.db.Preload("Tags").First(&post, post.ID).Error; err != nil {
			return nil, err
		}
	}

	return &post, nil
}

// UpdatePost updates an existing blog post
func (s *PostService) UpdatePost(id uint, req models.UpdatePostRequest) (*models.Post, error) {
	var post models.Post
	if err := s.db.Preload("Tags").First(&post, id).Error; err != nil {
		return nil, err
	}

	// Update fields if provided
	if req.Title != nil {
		post.Title = *req.Title
		// Only auto-generate slug if no custom slug was provided
		if req.Slug == nil {
			post.Slug = generateSlug(*req.Title)
		}
	}
	
	if req.Slug != nil {
		newSlug := sanitizeSlug(*req.Slug)
		// Ensure the new slug is unique (but allow keeping the same slug)
		if newSlug != post.Slug {
			finalSlug, err := s.ensureUniqueSlug(newSlug)
			if err != nil {
				return nil, err
			}
			post.Slug = finalSlug
		}
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

	// Handle tag updates if provided
	if req.TagIDs != nil {
		// Clear existing tags
		if err := s.db.Model(&post).Association("Tags").Clear(); err != nil {
			return nil, fmt.Errorf("failed to clear existing tags: %w", err)
		}

		// Add new tags if any provided
		if len(*req.TagIDs) > 0 {
			tags, err := s.tagService.GetTagsByIDs(*req.TagIDs)
			if err != nil {
				return nil, fmt.Errorf("failed to get tags: %w", err)
			}

			if err := s.db.Model(&post).Association("Tags").Append(tags); err != nil {
				return nil, fmt.Errorf("failed to associate tags: %w", err)
			}
		}
	}

	if err := s.db.Save(&post).Error; err != nil {
		return nil, err
	}

	// Reload post with updated tags
	if err := s.db.Preload("Tags").First(&post, post.ID).Error; err != nil {
		return nil, err
	}

	return &post, nil
}

// IncrementViewCount increments the view count for a post
func (s *PostService) IncrementViewCount(id uint) error {
	return s.db.Model(&models.Post{}).Where("id = ?", id).UpdateColumn("view_count", gorm.Expr("view_count + 1")).Error
}

// GetPostByIDAndIncrementViews retrieves a post by ID and increments view count
func (s *PostService) GetPostByIDAndIncrementViews(id uint, publishedOnly bool) (*models.Post, error) {
	var post models.Post
	query := s.db.Preload("Tags")

	if publishedOnly {
		query = query.Where("published = ?", true)
	}

	if err := query.First(&post, id).Error; err != nil {
		return nil, err
	}

	// Increment view count in a separate transaction
	if err := s.IncrementViewCount(id); err != nil {
		// Log the error but don't fail the request
		// The post retrieval is more important than the view count increment
		return &post, nil
	}

	// Reload post to get the updated view count
	if err := query.First(&post, id).Error; err != nil {
		return nil, err
	}

	return &post, nil
}

// GetPostBySlugAndIncrementViews retrieves a post by slug and increments view count
func (s *PostService) GetPostBySlugAndIncrementViews(slug string, publishedOnly bool) (*models.Post, error) {
	var post models.Post
	query := s.db.Preload("Tags").Where("slug = ?", slug)

	if publishedOnly {
		query = query.Where("published = ?", true)
	}

	if err := query.First(&post).Error; err != nil {
		return nil, err
	}

	// Increment view count in a separate transaction
	if err := s.IncrementViewCount(post.ID); err != nil {
		// Log the error but don't fail the request
		// The post retrieval is more important than the view count increment
		return &post, nil
	}

	// Reload post to get the updated view count
	if err := query.First(&post).Error; err != nil {
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

// ensureUniqueSlug ensures the slug is unique by appending a number if needed
func (s *PostService) ensureUniqueSlug(baseSlug string) (string, error) {
	slug := baseSlug
	counter := 1
	
	for {
		var existingPost models.Post
		err := s.db.Where("slug = ?", slug).First(&existingPost).Error
		
		if err == gorm.ErrRecordNotFound {
			// Slug is unique
			return slug, nil
		}
		
		if err != nil {
			// Database error
			return "", err
		}
		
		// Slug exists, try with a suffix
		slug = fmt.Sprintf("%s-%d", baseSlug, counter)
		counter++
		
		// Prevent infinite loops
		if counter > 1000 {
			return "", fmt.Errorf("unable to generate unique slug")
		}
	}
}

// sanitizeSlug cleans up a user-provided slug
func sanitizeSlug(slug string) string {
	// Convert to lowercase
	slug = strings.ToLower(slug)
	
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
	
	// Ensure slug is not empty
	if slug == "" {
		slug = "post"
	}
	
	return slug
}

// generateSlug creates a URL-friendly slug from a title
func generateSlug(title string) string {
	return sanitizeSlug(title)
}