package services

import (
	"github.com/bytetopia/BlankoBlog/backend/internal/models"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type UserService struct {
	db *gorm.DB
}

func NewUserService(db *gorm.DB) *UserService {
	return &UserService{db: db}
}

// ValidateUser validates username and password
func (s *UserService) ValidateUser(username, password string) (*models.User, error) {
	var user models.User
	
	// Find user by username or email
	if err := s.db.Where("username = ? OR email = ?", username, username).First(&user).Error; err != nil {
		return nil, err
	}

	// Check password (in a real app, you'd compare with bcrypt hash)
	// For now, using a simple hash comparison
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		return nil, err
	}

	return &user, nil
}

// GetUserByID retrieves a user by ID
func (s *UserService) GetUserByID(id uint) (*models.User, error) {
	var user models.User
	if err := s.db.First(&user, id).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

// CreateUser creates a new user (for future expansion)
func (s *UserService) CreateUser(username, email, password string, isAdmin bool) (*models.User, error) {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	user := models.User{
		Username: username,
		Email:    email,
		Password: string(hashedPassword),
		IsAdmin:  isAdmin,
	}

	if err := s.db.Create(&user).Error; err != nil {
		return nil, err
	}

	return &user, nil
}