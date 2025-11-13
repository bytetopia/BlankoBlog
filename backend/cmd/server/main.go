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
	config.AllowCredentials = true
	r.Use(cors.New(config))

	// Initialize services
	userService := services.NewUserService(db)
	configService := services.NewConfigService(db)
	tagService := services.NewTagService(db)
	commentService := services.NewCommentService(db)
	rssService := services.NewRSSService(db, configService)

	// Initialize default configurations
	if err := configService.InitializeDefaultConfigs(); err != nil {
		log.Printf("Warning: Failed to initialize default configs: %v", err)
	}

	// Initialize handlers
	postHandler := handlers.NewPostHandler(db)
	authHandler := handlers.NewAuthHandler(db)
	settingsHandler := handlers.NewSettingsHandler(configService, userService, db)
	tagHandler := handlers.NewTagHandler(tagService)
	commentHandler := handlers.NewCommentHandler(commentService)
	rssHandler := handlers.NewRSSHandler(rssService)

	// API routes
	api := r.Group("/api")
	{
		// Public routes
		public := api.Group("/public")
		{
			public.GET("/posts", postHandler.GetPosts)
			public.GET("/posts/:id", postHandler.GetPublicPost) // Public post detail with view count increment
			public.GET("/tags", tagHandler.GetAllTags)
			public.GET("/tags/with-counts", tagHandler.GetAllTagsWithPostCount)
			public.GET("/tags/:id", tagHandler.GetTag)
			public.GET("/tags/:id/posts", tagHandler.GetPostsByTag)

			// Public config routes (for blog name, description, etc.)
			public.GET("/config", settingsHandler.GetConfigs)

			// Public comment routes
			public.POST("/comments", commentHandler.CreateComment)
			public.GET("/posts/:id/comments", commentHandler.GetCommentsByPostID)
		}

		// Auth routes (separate from public/admin)
		api.POST("/auth/login", authHandler.Login)

		// Protected admin routes
		admin := api.Group("/admin")
		admin.Use(authHandler.AuthMiddleware())
		{
			// Admin post routes (no view count increment)
			admin.GET("/posts/:id", postHandler.GetAdminPost) // Admin post detail without view count increment
			admin.POST("/posts", postHandler.CreatePost)
			admin.PUT("/posts/:id", postHandler.UpdatePost)
			admin.DELETE("/posts/:id", postHandler.DeletePost)
			
			// Tag management routes (admin only)
			admin.POST("/tags", tagHandler.CreateTag)
			admin.PUT("/tags/:id", tagHandler.UpdateTag)
			admin.DELETE("/tags/:id", tagHandler.DeleteTag)
			
			// Comment management routes (admin only)
			admin.GET("/comments/list", commentHandler.GetAllCommentsForAdmin)
			admin.GET("/comments/stats", commentHandler.GetCommentStats)
			admin.GET("/comments/:id", commentHandler.GetCommentForAdmin)
			admin.PUT("/comments/:id/status", commentHandler.UpdateCommentStatus)
			admin.DELETE("/comments/:id", commentHandler.DeleteComment)
			
			// Settings routes
			admin.PUT("/settings/config", settingsHandler.UpdateConfigs)
			admin.PUT("/settings/password", settingsHandler.UpdatePassword)
		}
	}

	// RSS feed endpoints (outside of /api to follow standard RSS conventions)
	r.GET("/rss", rssHandler.GetRSSFeed)
	r.GET("/rss.xml", rssHandler.GetRSSFeed)
	r.GET("/feed", rssHandler.GetRSSFeed)
	r.GET("/feed.xml", rssHandler.GetRSSFeed)

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