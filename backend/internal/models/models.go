package models

import (
	"time"

	"gorm.io/gorm"
)

// Post represents a blog post
type Post struct {
	ID        uint           `json:"id" gorm:"primarykey"`
	Title     string         `json:"title" gorm:"not null" validate:"required,min=1,max=200"`
	Content   string         `json:"content" gorm:"not null" validate:"required,min=1"`
	Summary   string         `json:"summary" gorm:"size:500"`
	Slug      string         `json:"slug" gorm:"uniqueIndex;not null"`
	Published bool           `json:"published" gorm:"default:false"`
	ViewCount uint           `json:"view_count" gorm:"default:0"`
	Tags      []Tag          `json:"tags" gorm:"many2many:post_tags;"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

// Tag represents a tag that can be associated with posts
type Tag struct {
	ID        uint           `json:"id" gorm:"primarykey"`
	Name      string         `json:"name" gorm:"uniqueIndex;not null" validate:"required,min=1,max=50"`
	Color     string         `json:"color" gorm:"size:7"` // Hex color code like #FF0000
	Posts     []Post         `json:"-" gorm:"many2many:post_tags;"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

// User represents an admin user
type User struct {
	ID        uint           `json:"id" gorm:"primarykey"`
	Username  string         `json:"username" gorm:"uniqueIndex;not null" validate:"required,min=3,max=50"`
	Email     string         `json:"email" gorm:"uniqueIndex;not null" validate:"required,email"`
	Password  string         `json:"-" gorm:"not null" validate:"required,min=6"`
	IsAdmin   bool           `json:"is_admin" gorm:"default:false"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

// Config represents system configuration settings
type Config struct {
	ID          uint      `json:"id" gorm:"primarykey"`
	Key         string    `json:"key" gorm:"uniqueIndex;not null"`
	Value       string    `json:"value" gorm:"not null"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// Comment represents a comment on a blog post
type Comment struct {
	ID        uint           `json:"id" gorm:"primarykey"`
	PostID    uint           `json:"post_id" gorm:"not null"`
	Post      Post           `json:"post,omitempty" gorm:"foreignKey:PostID"`
	Name      string         `json:"name" gorm:"not null" validate:"required,min=1,max=100"`
	Email     string         `json:"email" gorm:"size:255" validate:"omitempty,email,max=255"`
	Content   string         `json:"content" gorm:"not null" validate:"required,min=1,max=2000"`
	Status    string         `json:"status" gorm:"not null;default:'pending'" validate:"required,oneof=pending approved hidden"`
	IPAddress string         `json:"ip_address" gorm:"size:45"`     // IPv4/IPv6 address
	Referer   string         `json:"referer" gorm:"size:500"`       // HTTP Referer header
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

// File represents an uploaded file associated with a post
type File struct {
	ID               uint           `json:"id" gorm:"primarykey"`
	PostID           uint           `json:"post_id" gorm:"not null;index"`
	Post             Post           `json:"post,omitempty" gorm:"foreignKey:PostID"`
	OriginalFileName string         `json:"original_file_name" gorm:"not null"`
	DisplayName      string         `json:"display_name" gorm:"not null"`
	Description      string         `json:"description" gorm:"size:500"`
	ServerPath       string         `json:"server_path" gorm:"not null;uniqueIndex"`
	FileSize         int64          `json:"file_size" gorm:"not null"`
	MimeType         string         `json:"mime_type" gorm:"size:100"`
	CreatedAt        time.Time      `json:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at"`
	DeletedAt        gorm.DeletedAt `json:"-" gorm:"index"`
}

// PostResponse represents the public response format for a post
type PostResponse struct {
	ID        uint      `json:"id"`
	Title     string    `json:"title"`
	Content   string    `json:"content"`
	Summary   string    `json:"summary"`
	Slug      string    `json:"slug"`
	Published bool      `json:"published"`
	ViewCount uint      `json:"view_count"`
	Tags      []Tag     `json:"tags"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// CreatePostRequest represents the request to create a new post
type CreatePostRequest struct {
	Title     string   `json:"title" validate:"required,min=1,max=200"`
	Content   string   `json:"content" validate:"required,min=1"`
	Summary   string   `json:"summary"`
	Slug      string   `json:"slug,omitempty"`
	Published bool     `json:"published"`
	TagIDs    []uint   `json:"tag_ids,omitempty"`
}

// UpdatePostRequest represents the request to update a post
type UpdatePostRequest struct {
	Title     *string  `json:"title,omitempty" validate:"omitempty,min=1,max=200"`
	Content   *string  `json:"content,omitempty" validate:"omitempty,min=1"`
	Summary   *string  `json:"summary,omitempty"`
	Slug      *string  `json:"slug,omitempty"`
	Published *bool    `json:"published,omitempty"`
	TagIDs    *[]uint  `json:"tag_ids,omitempty"`
}

// LoginRequest represents the login request
type LoginRequest struct {
	Username string `json:"username" validate:"required"`
	Password string `json:"password" validate:"required"`
}

// LoginResponse represents the login response
type LoginResponse struct {
	Token string `json:"token"`
	User  struct {
		ID       uint   `json:"id"`
		Username string `json:"username"`
		Email    string `json:"email"`
		IsAdmin  bool   `json:"is_admin"`
	} `json:"user"`
}

// UpdateConfigRequest represents the request to update configuration
type UpdateConfigRequest struct {
	Configs map[string]string `json:"configs" validate:"required"`
}

// ConfigResponse represents the configuration response
type ConfigResponse struct {
	Configs map[string]string `json:"configs"`
}

// UpdatePasswordRequest represents the request to update user password
type UpdatePasswordRequest struct {
	CurrentPassword string `json:"current_password" validate:"required"`
	NewPassword     string `json:"new_password" validate:"required,min=6"`
}

// CreateTagRequest represents the request to create a new tag
type CreateTagRequest struct {
	Name  string `json:"name" validate:"required,min=1,max=50"`
	Color string `json:"color,omitempty"`
}

// UpdateTagRequest represents the request to update a tag
type UpdateTagRequest struct {
	Name  *string `json:"name,omitempty" validate:"omitempty,min=1,max=50"`
	Color *string `json:"color,omitempty"`
}

// TagWithPostCount represents a tag with its associated post count
type TagWithPostCount struct {
	ID        uint      `json:"id"`
	Name      string    `json:"name"`
	Color     string    `json:"color"`
	PostCount int64     `json:"post_count"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// CreateCommentRequest represents the request to create a new comment
type CreateCommentRequest struct {
	PostID  uint   `json:"post_id" validate:"required"`
	Name    string `json:"name" validate:"required,min=1,max=100"`
	Email   string `json:"email" validate:"omitempty,email,max=255"`
	Content string `json:"content" validate:"required,min=1,max=2000"`
}

// CommentResponse represents the public response format for a comment
type CommentResponse struct {
	ID        uint      `json:"id"`
	PostID    uint      `json:"post_id"`
	Name      string    `json:"name"`
	Email     string    `json:"email,omitempty"` // Only show email to admin
	Content   string    `json:"content"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
}

// CommentAdminResponse represents the admin response format for a comment
type CommentAdminResponse struct {
	ID        uint      `json:"id"`
	PostID    uint      `json:"post_id"`
	PostTitle string    `json:"post_title,omitempty"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Content   string    `json:"content"`
	Status    string    `json:"status"`
	IPAddress string    `json:"ip_address"`
	Referer   string    `json:"referer"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// UpdateCommentStatusRequest represents the request to update comment status
type UpdateCommentStatusRequest struct {
	Status string `json:"status" validate:"required,oneof=pending approved hidden"`
}

// ToResponse converts a Comment to CommentResponse (public view)
func (c *Comment) ToResponse() CommentResponse {
	return CommentResponse{
		ID:        c.ID,
		PostID:    c.PostID,
		Name:      c.Name,
		Content:   c.Content,
		Status:    c.Status,
		CreatedAt: c.CreatedAt,
	}
}

// ToAdminResponse converts a Comment to CommentAdminResponse (admin view)
func (c *Comment) ToAdminResponse() CommentAdminResponse {
	response := CommentAdminResponse{
		ID:        c.ID,
		PostID:    c.PostID,
		Name:      c.Name,
		Email:     c.Email,
		Content:   c.Content,
		Status:    c.Status,
		IPAddress: c.IPAddress,
		Referer:   c.Referer,
		CreatedAt: c.CreatedAt,
		UpdatedAt: c.UpdatedAt,
	}
	
	// Include post title if available
	if c.Post.ID != 0 {
		response.PostTitle = c.Post.Title
	}
	
	return response
}

// ToResponse converts a Post to PostResponse
func (p *Post) ToResponse() PostResponse {
	return PostResponse{
		ID:        p.ID,
		Title:     p.Title,
		Content:   p.Content,
		Summary:   p.Summary,
		Slug:      p.Slug,
		Published: p.Published,
		ViewCount: p.ViewCount,
		Tags:      p.Tags,
		CreatedAt: p.CreatedAt,
		UpdatedAt: p.UpdatedAt,
	}
}

// FileResponse represents the response format for a file
type FileResponse struct {
	ID               uint      `json:"id"`
	PostID           uint      `json:"post_id"`
	PostTitle        string    `json:"post_title,omitempty"`
	OriginalFileName string    `json:"original_file_name"`
	DisplayName      string    `json:"display_name"`
	Description      string    `json:"description"`
	ServerPath       string    `json:"server_path"`
	FileSize         int64     `json:"file_size"`
	MimeType         string    `json:"mime_type"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

// UpdateFileRequest represents the request to update file metadata
type UpdateFileRequest struct {
	DisplayName *string `json:"display_name,omitempty" validate:"omitempty,min=1,max=255"`
	Description *string `json:"description,omitempty" validate:"omitempty,max=500"`
}

// ToResponse converts a File to FileResponse
func (f *File) ToResponse() FileResponse {
	response := FileResponse{
		ID:               f.ID,
		PostID:           f.PostID,
		OriginalFileName: f.OriginalFileName,
		DisplayName:      f.DisplayName,
		Description:      f.Description,
		ServerPath:       f.ServerPath,
		FileSize:         f.FileSize,
		MimeType:         f.MimeType,
		CreatedAt:        f.CreatedAt,
		UpdatedAt:        f.UpdatedAt,
	}
	
	// Include post title if available
	if f.Post.ID != 0 {
		response.PostTitle = f.Post.Title
	}
	
	return response
}
