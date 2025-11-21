package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"github.com/bytetopia/BlankoBlog/backend/internal/models"
	"github.com/bytetopia/BlankoBlog/backend/internal/services"
)

type SettingsHandler struct {
	configService *services.ConfigService
	userService   *services.UserService
	db            *gorm.DB
	validator     *validator.Validate
}

func NewSettingsHandler(configService *services.ConfigService, userService *services.UserService, db *gorm.DB) *SettingsHandler {
	return &SettingsHandler{
		configService: configService,
		userService:   userService,
		db:            db,
		validator:     validator.New(),
	}
}

// GetConfigs handles GET /api/settings/config
func (h *SettingsHandler) GetConfigs(c *gin.Context) {
	configs, err := h.configService.GetAllConfigs()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve configurations"})
		return
	}

	c.JSON(http.StatusOK, models.ConfigResponse{Configs: configs})
}

// UpdateConfigs handles PUT /api/settings/config
func (h *SettingsHandler) UpdateConfigs(c *gin.Context) {
	var req models.UpdateConfigRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	if err := h.validator.Struct(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate that only allowed config keys are being updated
	allowedKeys := map[string]bool{
		"blog_name":        true,
		"blog_description": true,
		"custom_css":       true,
		"language":         true,
		"blog_timezone":    true,
		"footer_links":     true,
	}

	for key := range req.Configs {
		if !allowedKeys[key] {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid configuration key: " + key})
			return
		}
	}

	err := h.configService.UpdateConfigs(req.Configs)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update configurations"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Configurations updated successfully"})
}

// UpdatePassword handles PUT /api/settings/password
func (h *SettingsHandler) UpdatePassword(c *gin.Context) {
	var req models.UpdatePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	if err := h.validator.Struct(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user from context (set by auth middleware)
	userInterface, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Type assert to get the user
	user, ok := userInterface.(*models.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user from context"})
		return
	}

	// Fetch the full user from database to ensure we have the latest password
	var dbUser models.User
	if err := h.db.First(&dbUser, user.ID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Verify current password
	if err := bcrypt.CompareHashAndPassword([]byte(dbUser.Password), []byte(req.CurrentPassword)); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Current password is incorrect"})
		return
	}

	// Hash new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Update password in database
	dbUser.Password = string(hashedPassword)
	if err := h.db.Save(&dbUser).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update password"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password updated successfully"})
}