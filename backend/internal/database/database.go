package database

import (
	"fmt"
	"log"
	"os"

	"github.com/bytetopia/BlankoBlog/backend/internal/models"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// Initialize sets up the database connection and runs migrations
func Initialize() (*gorm.DB, error) {
	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "./data/blog.db"
	}

	// Ensure data directory exists
	if err := os.MkdirAll("./data", 0755); err != nil {
		return nil, fmt.Errorf("failed to create data directory: %w", err)
	}

	// Configure GORM logger
	logLevel := logger.Error
	if os.Getenv("ENV") == "development" {
		logLevel = logger.Info
	}

	// Open database connection
	db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{
		Logger: logger.Default.LogMode(logLevel),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	// Run migrations
	if err := runMigrations(db); err != nil {
		return nil, fmt.Errorf("failed to run migrations: %w", err)
	}

	// Always seed admin user data for all environments
	if err := seedAdminUser(db); err != nil {
		log.Printf("Warning: failed to seed admin user: %v", err)
	}

	// Seed sample posts only in development
	if os.Getenv("ENV") == "development" {
		if err := seedSamplePosts(db); err != nil {
			log.Printf("Warning: failed to seed sample posts: %v", err)
		}
	}

	log.Println("Database initialized successfully")
	return db, nil
}

// runMigrations applies database schema migrations
func runMigrations(db *gorm.DB) error {
	return db.AutoMigrate(
		&models.User{},
		&models.Post{},
		&models.Config{},
	)
}

// seedAdminUser creates the default admin user if no users exist
func seedAdminUser(db *gorm.DB) error {
	// Check if admin user already exists
	var userCount int64
	if err := db.Model(&models.User{}).Count(&userCount).Error; err != nil {
		return err
	}

	if userCount == 0 {
		// Create default admin user (password: admin123)
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
		if err != nil {
			return err
		}
		
		adminUser := models.User{
			Username: "admin",
			Email:    "admin@blankoblog.com",
			Password: string(hashedPassword),
			IsAdmin:  true,
		}
		if err := db.Create(&adminUser).Error; err != nil {
			return err
		}
		log.Println("Created default admin user (username: admin, password: admin123)")
	}

	return nil
}

// seedSamplePosts creates sample blog posts for development
func seedSamplePosts(db *gorm.DB) error {
	// Check if any posts exist
	var postCount int64
	if err := db.Model(&models.Post{}).Count(&postCount).Error; err != nil {
		return err
	}

	if postCount == 0 {
		// Create sample blog posts
		samplePosts := []models.Post{
			{
				Title:     "Welcome to Blanko Blog",
				Content:   "This is your first blog post! Blanko is a simple, lightweight blog system built with Go and React. You can edit this post or create new ones through the admin panel.",
				Summary:   "Welcome to your new blog system built with Go and React.",
				Slug:      "welcome-to-blanko-blog",
				Published: true,
			},
			{
				Title:     "Getting Started with Blogging",
				Content:   "Writing a blog can be rewarding experience. Here are some tips to get you started:\n\n1. Choose topics you're passionate about\n2. Write regularly\n3. Engage with your readers\n4. Keep your content authentic\n\nRemember, the most important thing is to start writing and improve over time.",
				Summary:   "Tips and advice for starting your blogging journey.",
				Slug:      "getting-started-with-blogging",
				Published: true,
			},
			{
				Title:     "Draft Post Example",
				Content:   "This is an example of a draft post. It won't be visible to your readers until you publish it.",
				Summary:   "An example of a draft post that's not yet published.",
				Slug:      "draft-post-example",
				Published: false,
			},
		}

		for _, post := range samplePosts {
			if err := db.Create(&post).Error; err != nil {
				return err
			}
		}
		log.Println("Created sample blog posts")
	}

	return nil
}