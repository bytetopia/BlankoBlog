package services

import (
	"encoding/xml"
	"fmt"
	"html"
	"strings"
	"time"

	"github.com/bytetopia/BlankoBlog/backend/internal/models"
	"gorm.io/gorm"
)

// RSS structs following RSS 2.0 specification
type RSS struct {
	XMLName xml.Name `xml:"rss"`
	Version string   `xml:"version,attr"`
	Channel Channel  `xml:"channel"`
}

type Channel struct {
	Title         string    `xml:"title"`
	Link          string    `xml:"link"`
	Description   string    `xml:"description"`
	Language      string    `xml:"language,omitempty"`
	Copyright     string    `xml:"copyright,omitempty"`
	LastBuildDate string    `xml:"lastBuildDate"`
	PubDate       string    `xml:"pubDate"`
	TTL           int       `xml:"ttl,omitempty"`
	Generator     string    `xml:"generator"`
	Items         []Item    `xml:"item"`
}

type Item struct {
	Title       string `xml:"title"`
	Link        string `xml:"link"`
	Description string `xml:"description"`
	PubDate     string `xml:"pubDate"`
	GUID        string `xml:"guid"`
	Author      string `xml:"author,omitempty"`
	Category    []string `xml:"category,omitempty"`
}

type RSSService struct {
	db            *gorm.DB
	configService *ConfigService
}

func NewRSSService(db *gorm.DB, configService *ConfigService) *RSSService {
	return &RSSService{
		db:            db,
		configService: configService,
	}
}

// GenerateRSSFeed generates RSS XML feed for published posts
func (s *RSSService) GenerateRSSFeed(baseURL string, limit int) (string, error) {
	// Get site configuration
	configs, err := s.configService.GetAllConfigs()
	if err != nil {
		return "", fmt.Errorf("failed to get site configs: %w", err)
	}

	// Set defaults if configs are empty
	siteName := getConfigFromMap(configs, "site_name", "Blog")
	siteDescription := getConfigFromMap(configs, "site_description", "A Blog Site")
	
	// Get recent published posts
	var posts []models.Post
	if err := s.db.Where("published = ?", true).
		Preload("Tags").
		Order("created_at DESC").
		Limit(limit).
		Find(&posts).Error; err != nil {
		return "", fmt.Errorf("failed to fetch posts: %w", err)
	}

	// Build RSS feed
	channel := Channel{
		Title:         siteName,
		Link:          baseURL,
		Description:   siteDescription,
		Language:      "en-us",
		LastBuildDate: time.Now().Format(time.RFC1123Z),
		PubDate:       time.Now().Format(time.RFC1123Z),
		TTL:           60, // Cache for 60 minutes
		Generator:     "BlankoBlog RSS Generator",
		Items:         make([]Item, 0, len(posts)),
	}

	// Add posts as RSS items
	for _, post := range posts {
		item := Item{
			Title:       html.EscapeString(post.Title),
			Link:        fmt.Sprintf("%s/posts/%s", baseURL, post.Slug),
			Description: html.EscapeString(s.generateDescription(post)),
			PubDate:     post.CreatedAt.Format(time.RFC1123Z),
			GUID:        fmt.Sprintf("%s/posts/%s", baseURL, post.Slug),
		}

		// Add tags as categories
		for _, tag := range post.Tags {
			item.Category = append(item.Category, html.EscapeString(tag.Name))
		}

		channel.Items = append(channel.Items, item)
	}

	// Create RSS structure
	rss := RSS{
		Version: "2.0",
		Channel: channel,
	}

	// Marshal to XML
	xmlData, err := xml.MarshalIndent(rss, "", "  ")
	if err != nil {
		return "", fmt.Errorf("failed to marshal RSS XML: %w", err)
	}

	// Add XML declaration
	xmlString := xml.Header + string(xmlData)
	return xmlString, nil
}

// generateDescription creates a description for RSS item
func (s *RSSService) generateDescription(post models.Post) string {
	// Use summary if available
	if post.Summary != "" {
		return post.Summary
	}

	// Otherwise, create a truncated version of content
	content := stripHTMLTags(post.Content)
	if len(content) > 300 {
		// Find a good breaking point (word boundary)
		truncated := content[:300]
		lastSpace := strings.LastIndex(truncated, " ")
		if lastSpace > 200 {
			truncated = truncated[:lastSpace]
		}
		return truncated + "..."
	}

	return content
}

// stripHTMLTags removes HTML tags from content
func stripHTMLTags(content string) string {
	// Simple HTML tag removal - could be enhanced with a proper HTML parser
	result := content
	inTag := false
	var builder strings.Builder
	
	for _, char := range result {
		if char == '<' {
			inTag = true
		} else if char == '>' {
			inTag = false
		} else if !inTag {
			builder.WriteRune(char)
		}
	}
	
	// Clean up multiple spaces and newlines
	cleaned := strings.TrimSpace(builder.String())
	cleaned = strings.ReplaceAll(cleaned, "\n\n", "\n")
	cleaned = strings.ReplaceAll(cleaned, "\n", " ")
	
	return cleaned
}

// getConfigFromMap gets a config value from map with a default fallback
func getConfigFromMap(configs map[string]string, key, defaultValue string) string {
	if value, exists := configs[key]; exists && value != "" {
		return value
	}
	return defaultValue
}