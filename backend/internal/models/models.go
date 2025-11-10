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

// PostResponse represents the public response format for a post
type PostResponse struct {
	ID        uint      `json:"id"`
	Title     string    `json:"title"`
	Content   string    `json:"content"`
	Summary   string    `json:"summary"`
	Slug      string    `json:"slug"`
	Published bool      `json:"published"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// CreatePostRequest represents the request to create a new post
type CreatePostRequest struct {
	Title     string `json:"title" validate:"required,min=1,max=200"`
	Content   string `json:"content" validate:"required,min=1"`
	Summary   string `json:"summary"`
	Slug      string `json:"slug,omitempty"`
	Published bool   `json:"published"`
}

// UpdatePostRequest represents the request to update a post
type UpdatePostRequest struct {
	Title     *string `json:"title,omitempty" validate:"omitempty,min=1,max=200"`
	Content   *string `json:"content,omitempty" validate:"omitempty,min=1"`
	Summary   *string `json:"summary,omitempty"`
	Slug      *string `json:"slug,omitempty"`
	Published *bool   `json:"published,omitempty"`
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

// ToResponse converts a Post to PostResponse
func (p *Post) ToResponse() PostResponse {
	return PostResponse{
		ID:        p.ID,
		Title:     p.Title,
		Content:   p.Content,
		Summary:   p.Summary,
		Slug:      p.Slug,
		Published: p.Published,
		CreatedAt: p.CreatedAt,
		UpdatedAt: p.UpdatedAt,
	}
}