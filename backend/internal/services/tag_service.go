package services

import (
	"errors"
	"fmt"
	"strings"

	"github.com/bytetopia/BlankoBlog/backend/internal/models"
	"gorm.io/gorm"
)

type TagService struct {
	db *gorm.DB
}

func NewTagService(db *gorm.DB) *TagService {
	return &TagService{db: db}
}

// GetAllTags retrieves all tags from the database
func (s *TagService) GetAllTags() ([]models.Tag, error) {
	var tags []models.Tag
	if err := s.db.Find(&tags).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch tags: %w", err)
	}
	return tags, nil
}

// GetTagByID retrieves a tag by its ID
func (s *TagService) GetTagByID(id uint) (*models.Tag, error) {
	var tag models.Tag
	if err := s.db.First(&tag, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("tag with ID %d not found", id)
		}
		return nil, fmt.Errorf("failed to fetch tag: %w", err)
	}
	return &tag, nil
}

// GetTagByName retrieves a tag by its name
func (s *TagService) GetTagByName(name string) (*models.Tag, error) {
	var tag models.Tag
	if err := s.db.Where("name = ?", name).First(&tag).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("tag with name '%s' not found", name)
		}
		return nil, fmt.Errorf("failed to fetch tag: %w", err)
	}
	return &tag, nil
}

// CreateTag creates a new tag
func (s *TagService) CreateTag(req models.CreateTagRequest) (*models.Tag, error) {
	// Validate name uniqueness
	var existingTag models.Tag
	if err := s.db.Where("name = ?", req.Name).First(&existingTag).Error; err == nil {
		return nil, fmt.Errorf("tag with name '%s' already exists", req.Name)
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, fmt.Errorf("failed to check tag uniqueness: %w", err)
	}

	// Set default color if not provided
	color := req.Color
	if color == "" {
		color = s.generateDefaultColor(req.Name)
	}

	tag := models.Tag{
		Name:  strings.TrimSpace(req.Name),
		Color: color,
	}

	if err := s.db.Create(&tag).Error; err != nil {
		return nil, fmt.Errorf("failed to create tag: %w", err)
	}

	return &tag, nil
}

// UpdateTag updates an existing tag
func (s *TagService) UpdateTag(id uint, req models.UpdateTagRequest) (*models.Tag, error) {
	// Check if tag exists
	tag, err := s.GetTagByID(id)
	if err != nil {
		return nil, err
	}

	// Check name uniqueness if name is being updated
	if req.Name != nil && *req.Name != tag.Name {
		var existingTag models.Tag
		if err := s.db.Where("name = ? AND id != ?", *req.Name, id).First(&existingTag).Error; err == nil {
			return nil, fmt.Errorf("tag with name '%s' already exists", *req.Name)
		} else if !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("failed to check tag uniqueness: %w", err)
		}
	}

	// Update fields
	updates := make(map[string]interface{})
	if req.Name != nil {
		updates["name"] = strings.TrimSpace(*req.Name)
	}
	if req.Color != nil {
		updates["color"] = *req.Color
	}

	if len(updates) > 0 {
		if err := s.db.Model(tag).Updates(updates).Error; err != nil {
			return nil, fmt.Errorf("failed to update tag: %w", err)
		}
	}

	// Return updated tag
	return s.GetTagByID(id)
}

// DeleteTag deletes a tag and removes its associations with posts
func (s *TagService) DeleteTag(id uint) error {
	// Check if tag exists
	tag, err := s.GetTagByID(id)
	if err != nil {
		return err
	}

	// Remove associations with posts first
	if err := s.db.Model(tag).Association("Posts").Clear(); err != nil {
		return fmt.Errorf("failed to clear tag associations: %w", err)
	}

	// Delete the tag
	if err := s.db.Delete(tag).Error; err != nil {
		return fmt.Errorf("failed to delete tag: %w", err)
	}

	return nil
}

// GetTagsByIDs retrieves multiple tags by their IDs
func (s *TagService) GetTagsByIDs(ids []uint) ([]models.Tag, error) {
	if len(ids) == 0 {
		return []models.Tag{}, nil
	}

	var tags []models.Tag
	if err := s.db.Where("id IN ?", ids).Find(&tags).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch tags: %w", err)
	}

	return tags, nil
}

// CreateOrGetTagByName creates a new tag if it doesn't exist, otherwise returns existing tag
func (s *TagService) CreateOrGetTagByName(name string) (*models.Tag, error) {
	// Try to find existing tag first
	tag, err := s.GetTagByName(name)
	if err == nil {
		return tag, nil
	}

	// If tag doesn't exist, create it
	createReq := models.CreateTagRequest{
		Name: name,
	}
	return s.CreateTag(createReq)
}

// GetAllTagsWithPostCount retrieves all tags with their post counts
func (s *TagService) GetAllTagsWithPostCount() ([]models.TagWithPostCount, error) {
	var tagsWithCounts []models.TagWithPostCount
	
	// Use raw SQL to get tags with post counts
	err := s.db.Raw(`
		SELECT 
			t.id,
			t.name,
			t.color,
			t.created_at,
			t.updated_at,
			COALESCE(pc.post_count, 0) as post_count
		FROM tags t
		LEFT JOIN (
			SELECT 
				pt.tag_id,
				COUNT(DISTINCT p.id) as post_count
			FROM post_tags pt
			INNER JOIN posts p ON pt.post_id = p.id
			WHERE p.deleted_at IS NULL AND p.published = true
			GROUP BY pt.tag_id
		) pc ON t.id = pc.tag_id
		ORDER BY t.name
	`).Scan(&tagsWithCounts).Error
	
	if err != nil {
		return nil, fmt.Errorf("failed to fetch tags with post counts: %w", err)
	}
	
	return tagsWithCounts, nil
}

// GetPostsByTag retrieves posts that have a specific tag with pagination
func (s *TagService) GetPostsByTag(tagID uint, page, limit int, publishedOnly bool) ([]models.Post, int64, error) {
	var posts []models.Post
	var total int64
	
	// Base query to get posts with specific tag
	query := s.db.Model(&models.Post{}).
		Joins("JOIN post_tags ON posts.id = post_tags.post_id").
		Where("post_tags.tag_id = ?", tagID).
		Preload("Tags")
	
	// Filter for published posts if needed
	if publishedOnly {
		query = query.Where("published = ?", true)
	}
	
	// Get total count
	err := query.Count(&total).Error
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count posts by tag: %w", err)
	}
	
	// Get paginated results
	offset := (page - 1) * limit
	err = query.Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&posts).Error
	
	if err != nil {
		return nil, 0, fmt.Errorf("failed to fetch posts by tag: %w", err)
	}
	
	return posts, total, nil
}

// GetPostsByTagName retrieves posts that have a specific tag by tag name with pagination
func (s *TagService) GetPostsByTagName(tagName string, page, limit int, publishedOnly bool) ([]models.Post, int64, error) {
	// First get the tag by name
	tag, err := s.GetTagByName(tagName)
	if err != nil {
		return nil, 0, err
	}
	
	return s.GetPostsByTag(tag.ID, page, limit, publishedOnly)
}

// generateDefaultColor generates a default color based on tag name
func (s *TagService) generateDefaultColor(name string) string {
	// Simple color generation based on name hash
	colors := []string{
		"#3B82F6", // blue
		"#10B981", // green
		"#8B5CF6", // purple
		"#F59E0B", // yellow
		"#EF4444", // red
		"#EC4899", // pink
		"#06B6D4", // cyan
		"#84CC16", // lime
		"#F97316", // orange
		"#6366F1", // indigo
	}
	
	// Simple hash function to pick a color
	hash := 0
	for _, char := range name {
		hash += int(char)
	}
	
	return colors[hash%len(colors)]
}