package handlers

import (
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/bytetopia/BlankoBlog/backend/internal/models"
	"github.com/bytetopia/BlankoBlog/backend/internal/services"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"gorm.io/gorm"
)

type AuthHandler struct {
	userService   *services.UserService
	configService *services.ConfigService
}

func NewAuthHandler(db *gorm.DB) *AuthHandler {
	return &AuthHandler{
		userService:   services.NewUserService(db),
		configService: services.NewConfigService(db),
	}
}

// Login handles POST /api/auth/login
func (h *AuthHandler) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	user, err := h.userService.ValidateUser(req.Username, req.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid username or password"})
		return
	}

	if !user.IsAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	// Generate JWT token
	token, err := h.generateJWT(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	response := models.LoginResponse{
		Token: token,
		User: struct {
			ID       uint   `json:"id"`
			Username string `json:"username"`
			Email    string `json:"email"`
			IsAdmin  bool   `json:"is_admin"`
		}{
			ID:       user.ID,
			Username: user.Username,
			Email:    user.Email,
			IsAdmin:  user.IsAdmin,
		},
	}

	c.JSON(http.StatusOK, response)
}

// AuthMiddleware validates JWT tokens for protected routes
func (h *AuthHandler) AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Bearer token required"})
			c.Abort()
			return
		}

		claims, err := h.validateJWT(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		// Get user from database to verify they still exist and are admin
		userID := uint(claims["user_id"].(float64))
		user, err := h.userService.GetUserByID(userID)
		if err != nil || !user.IsAdmin {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user or access denied"})
			c.Abort()
			return
		}

		// Set user in context for handlers to use
		c.Set("user", user)
		c.Next()
	}
}

// generateJWT creates a new JWT token for the user
func (h *AuthHandler) generateJWT(userID uint) (string, error) {
	secretKey := os.Getenv("JWT_SECRET")
	if secretKey == "" {
		// Get JWT secret from database, or generate if not exists
		var err error
		secretKey, err = h.configService.GetJWTSecret()
		if err != nil {
			return "", err
		}
	}

	claims := jwt.MapClaims{
		"user_id": userID,
		"exp":     time.Now().Add(time.Hour * 24 * 7).Unix(), // 7 days
		"iat":     time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secretKey))
}

// validateJWT validates a JWT token and returns the claims
func (h *AuthHandler) validateJWT(tokenString string) (jwt.MapClaims, error) {
	secretKey := os.Getenv("JWT_SECRET")
	if secretKey == "" {
		// Get JWT secret from database, or generate if not exists
		var err error
		secretKey, err = h.configService.GetJWTSecret()
		if err != nil {
			return nil, err
		}
	}

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, jwt.ErrSignatureInvalid
		}
		return []byte(secretKey), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, jwt.ErrSignatureInvalid
}