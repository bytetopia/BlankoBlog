package handlers

import (
	"net/http"
	"strconv"

	"github.com/bytetopia/BlankoBlog/backend/internal/services"
	"github.com/gin-gonic/gin"
)

type RSSHandler struct {
	rssService *services.RSSService
}

func NewRSSHandler(rssService *services.RSSService) *RSSHandler {
	return &RSSHandler{
		rssService: rssService,
	}
}

// GetRSSFeed generates and returns RSS XML feed
func (h *RSSHandler) GetRSSFeed(c *gin.Context) {
	// Get limit parameter (default 20, max 50)
	limitStr := c.DefaultQuery("limit", "20")
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit < 1 {
		limit = 20
	}
	if limit > 50 {
		limit = 50
	}

	// Build base URL for the site
	scheme := "http"
	if c.Request.TLS != nil || c.GetHeader("X-Forwarded-Proto") == "https" {
		scheme = "https"
	}
	baseURL := scheme + "://" + c.Request.Host

	// Generate RSS feed
	rssXML, err := h.rssService.GenerateRSSFeed(baseURL, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate RSS feed"})
		return
	}

	// Set appropriate headers for RSS feed
	c.Header("Content-Type", "application/rss+xml; charset=utf-8")
	c.Header("Cache-Control", "public, max-age=3600") // Cache for 1 hour
	
	// Return RSS XML
	c.String(http.StatusOK, rssXML)
}