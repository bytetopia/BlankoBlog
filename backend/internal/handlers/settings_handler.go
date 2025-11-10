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
		"blog_name":         true,
		"blog_description":  true,
		"blog_introduction": true,
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

	// Get user ID from context (set by auth middleware)
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Get user from database
	var user models.User
	if err := h.db.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Verify current password
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.CurrentPassword)); err != nil {
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
	user.Password = string(hashedPassword)
	if err := h.db.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update password"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password updated successfully"})
}