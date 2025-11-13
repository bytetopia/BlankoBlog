package main

import (
	"log"
	"os"
	"strings"

	"github.com/bytetopia/BlankoBlog/backend/internal/database"
	"github.com/bytetopia/BlankoBlog/backend/internal/handlers"
	"github.com/bytetopia/BlankoBlog/backend/internal/services"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// Initialize database
	db, err := database.Initialize()
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Set up Gin router
	r := gin.Default()

	// Configure CORS
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"http://localhost:3000", "http://localhost:5173"} // React dev servers
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization"}
	r.Use(cors.New(config))

	// Initialize services
	userService := services.NewUserService(db)
	configService := services.NewConfigService(db)
	tagService := services.NewTagService(db)

	// Initialize default configurations
	if err := configService.InitializeDefaultConfigs(); err != nil {
		log.Printf("Warning: Failed to initialize default configs: %v", err)
	}

	// Initialize handlers
	postHandler := handlers.NewPostHandler(db)
	authHandler := handlers.NewAuthHandler(db)
	settingsHandler := handlers.NewSettingsHandler(configService, userService, db)
	tagHandler := handlers.NewTagHandler(tagService)

	// API routes
	api := r.Group("/api")
	{
		// Public routes
		api.GET("/posts", postHandler.GetPosts)
		api.GET("/public/posts/:id", postHandler.GetPublicPost) // Public post detail with view count increment
		api.GET("/tags", tagHandler.GetAllTags)
		api.GET("/tags/with-counts", tagHandler.GetAllTagsWithPostCount)
		api.GET("/tags/:id", tagHandler.GetTag)
		api.GET("/tags/:id/posts", tagHandler.GetPostsByTag)

		// Public config routes (for blog name, description, etc.)
		api.GET("/config", settingsHandler.GetConfigs)

		// Auth routes
		api.POST("/auth/login", authHandler.Login)

		// Protected routes (admin only)
		protected := api.Group("/")
		protected.Use(authHandler.AuthMiddleware())
		{
			// Admin-only post routes (no view count increment)
			protected.GET("/admin/posts/:id", postHandler.GetAdminPost) // Admin post detail without view count increment
			protected.POST("/posts", postHandler.CreatePost)
			protected.PUT("/posts/:id", postHandler.UpdatePost)
			protected.DELETE("/posts/:id", postHandler.DeletePost)
			
			// Tag management routes (admin only)
			protected.POST("/tags", tagHandler.CreateTag)
			protected.PUT("/tags/:id", tagHandler.UpdateTag)
			protected.DELETE("/tags/:id", tagHandler.DeleteTag)
			
			// Settings routes
			settings := protected.Group("/settings")
			{
				settings.PUT("/config", settingsHandler.UpdateConfigs)
				settings.PUT("/password", settingsHandler.UpdatePassword)
			}
		}
	}

	// Serve static files (frontend)
	r.Static("/static", "./static")
	r.Static("/assets", "./static/assets")
	r.StaticFile("/", "./static/index.html")
	
	// Handle favicon requests gracefully
	r.GET("/favicon.ico", func(c *gin.Context) {
		c.File("./static/vite.svg")
	})
	
	// Serve index.html for any non-API routes (SPA routing)
	r.NoRoute(func(c *gin.Context) {
		// Skip API routes
		if !strings.HasPrefix(c.Request.URL.Path, "/api") && !strings.HasPrefix(c.Request.URL.Path, "/health") {
			c.File("./static/index.html")
		} else {
			c.JSON(404, gin.H{"error": "Not found"})
		}
	})

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}