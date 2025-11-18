package handlers

import (
	"crypto/md5"
	"fmt"
	"html/template"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"github.com/bytetopia/BlankoBlog/backend/internal/models"
	"github.com/bytetopia/BlankoBlog/backend/internal/services"
	"github.com/gin-gonic/gin"
	"github.com/russross/blackfriday/v2"
	"gorm.io/gorm"
)

// TemplateHandler handles HTML template rendering for public pages
type TemplateHandler struct {
	db            *gorm.DB
	configService *services.ConfigService
	templates     *template.Template
}

// NewTemplateHandler creates a new template handler
func NewTemplateHandler(db *gorm.DB, configService *services.ConfigService) *TemplateHandler {
	// Parse all HTML templates
	templates, err := template.ParseGlob(filepath.Join("templates", "html", "*.gohtml"))
	if err != nil {
		log.Printf("Warning: Failed to parse templates: %v", err)
	}

	return &TemplateHandler{
		db:            db,
		configService: configService,
		templates:     templates,
	}
}

// PostListData represents data for the post list template
type PostListData struct {
	BlogName        string
	BlogDescription string
	BaseURL         string
	Year            int
	Posts           []PostData
	Pagination      PaginationData
}

// PostDetailData represents data for the post detail template
type PostDetailData struct {
	BlogName        string
	BlogDescription string
	BaseURL         string
	Year            int
	Post            PostData
	Comments        []CommentData
}

// TagListData represents data for the tag list template (both tag list and tag posts)
type TagListData struct {
	BlogName        string
	BlogDescription string
	BaseURL         string
	Year            int
	Tag             *TagData
	Tags            []TagWithCountData
	Posts           []PostData
	Pagination      PaginationData
}

// PostData represents a single post for templates
type PostData struct {
	ID            uint
	Title         string
	Content       string
	ContentHTML   template.HTML
	Summary       string
	Slug          string
	ViewCount     uint
	Tags          []TagData
	CreatedAt     time.Time
	FormattedDate string
}

// TagData represents a tag for templates
type TagData struct {
	ID    uint
	Name  string
	Color string
}

// TagWithCountData represents a tag with post count
type TagWithCountData struct {
	ID        uint
	Name      string
	Color     string
	PostCount int
}

// CommentData represents a comment for templates
type CommentData struct {
	ID            uint
	Name          string
	Email         string
	EmailHash     string
	Content       string
	CreatedAt     time.Time
	FormattedDate string
}

// PaginationData represents pagination information
type PaginationData struct {
	Page       int
	TotalPages int
	Total      int
	PrevPage   int
	NextPage   int
	Pages      []int
}

// getBaseData gets common template data
func (h *TemplateHandler) getBaseData(c *gin.Context) (string, string, string, error) {
	blogName, err := h.configService.GetConfig("blog_name")
	if err != nil || blogName == "" {
		blogName = "BlankoBlog"
	}

	blogDescription, err := h.configService.GetConfig("blog_description")
	if err != nil || blogDescription == "" {
		blogDescription = "A simple blog"
	}

	// Auto-detect base URL from request
	baseURL := os.Getenv("BASE_URL")
	if baseURL == "" {
		// Auto-detect from request
		scheme := "http"
		if c.Request.TLS != nil || c.GetHeader("X-Forwarded-Proto") == "https" {
			scheme = "https"
		}
		baseURL = scheme + "://" + c.Request.Host
	}

	return blogName, blogDescription, baseURL, nil
}

// formatDate formats a time to a readable string
func formatDate(t time.Time) string {
	return t.Format("January 2, 2006")
}

// convertPostToData converts a Post model to PostData
func convertPostToData(post models.Post) PostData {
	tags := make([]TagData, len(post.Tags))
	for i, tag := range post.Tags {
		tags[i] = TagData{
			ID:    tag.ID,
			Name:  tag.Name,
			Color: tag.Color,
		}
	}

	// Convert markdown to HTML
	contentHTML := template.HTML(blackfriday.Run([]byte(post.Content)))

	return PostData{
		ID:            post.ID,
		Title:         post.Title,
		Content:       post.Content,
		ContentHTML:   contentHTML,
		Summary:       post.Summary,
		Slug:          post.Slug,
		ViewCount:     post.ViewCount,
		Tags:          tags,
		CreatedAt:     post.CreatedAt,
		FormattedDate: formatDate(post.CreatedAt),
	}
}

// calculatePagination creates pagination data
func calculatePagination(page, totalPages int) PaginationData {
	prevPage := page - 1
	if prevPage < 1 {
		prevPage = 1
	}

	nextPage := page + 1
	if nextPage > totalPages {
		nextPage = totalPages
	}

	// Generate page numbers to show (show max 7 pages around current)
	pages := []int{}
	start := page - 3
	if start < 1 {
		start = 1
	}
	end := start + 6
	if end > totalPages {
		end = totalPages
		start = end - 6
		if start < 1 {
			start = 1
		}
	}

	for i := start; i <= end; i++ {
		pages = append(pages, i)
	}

	return PaginationData{
		Page:       page,
		TotalPages: totalPages,
		PrevPage:   prevPage,
		NextPage:   nextPage,
		Pages:      pages,
	}
}

// RenderPostList renders the post list (homepage)
func (h *TemplateHandler) RenderPostList(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	if page < 1 {
		page = 1
	}
	limit := 10

	var posts []models.Post
	var total int64

	// Get published posts with tags
	offset := (page - 1) * limit
	h.db.Model(&models.Post{}).Where("published = ?", true).Count(&total)
	h.db.Where("published = ?", true).
		Preload("Tags").
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&posts)

	// Convert posts to template data
	postData := make([]PostData, len(posts))
	for i, post := range posts {
		postData[i] = convertPostToData(post)
	}

	// Calculate pagination
	totalPages := int((total + int64(limit) - 1) / int64(limit))
	pagination := calculatePagination(page, totalPages)
	pagination.Total = int(total)

	// Get base data
	blogName, blogDescription, baseURL, _ := h.getBaseData(c)

	data := PostListData{
		BlogName:        blogName,
		BlogDescription: blogDescription,
		BaseURL:         baseURL,
		Year:            time.Now().Year(),
		Posts:           postData,
		Pagination:      pagination,
	}

	if err := h.templates.ExecuteTemplate(c.Writer, "post-list.gohtml", data); err != nil {
		log.Printf("Error rendering template: %v", err)
		c.String(http.StatusInternalServerError, "Error rendering page")
	}
}

// RenderPostDetail renders a single post detail page
func (h *TemplateHandler) RenderPostDetail(c *gin.Context) {
	slug := c.Param("slug")

	var post models.Post
	if err := h.db.Where("slug = ? AND published = ?", slug, true).Preload("Tags").First(&post).Error; err != nil {
		c.String(http.StatusNotFound, "Post not found")
		return
	}

	// Increment view count
	h.db.Model(&post).Update("view_count", post.ViewCount+1)
	post.ViewCount++

	// Get approved comments
	var comments []models.Comment
	h.db.Where("post_id = ? AND status = ?", post.ID, "approved").
		Order("created_at ASC").
		Find(&comments)

	// Convert comments to template data
	commentData := make([]CommentData, len(comments))
	for i, comment := range comments {
		emailHash := fmt.Sprintf("%x", md5.Sum([]byte(comment.Email)))
		commentData[i] = CommentData{
			ID:            comment.ID,
			Name:          comment.Name,
			Email:         comment.Email,
			EmailHash:     emailHash,
			Content:       comment.Content,
			CreatedAt:     comment.CreatedAt,
			FormattedDate: formatDate(comment.CreatedAt),
		}
	}

	// Get base data
	blogName, blogDescription, baseURL, _ := h.getBaseData(c)

	data := PostDetailData{
		BlogName:        blogName,
		BlogDescription: blogDescription,
		BaseURL:         baseURL,
		Year:            time.Now().Year(),
		Post:            convertPostToData(post),
		Comments:        commentData,
	}

	if err := h.templates.ExecuteTemplate(c.Writer, "post-detail.gohtml", data); err != nil {
		log.Printf("Error rendering template: %v", err)
		c.String(http.StatusInternalServerError, "Error rendering page")
	}
}

// RenderTagList renders the tag list page
func (h *TemplateHandler) RenderTagList(c *gin.Context) {
	var tags []models.Tag
	h.db.Order("name ASC").Find(&tags)

	// Get post count for each tag
	tagData := make([]TagWithCountData, len(tags))
	for i, tag := range tags {
		var count int64
		h.db.Model(&models.Post{}).
			Joins("JOIN post_tags ON post_tags.post_id = posts.id").
			Where("post_tags.tag_id = ? AND posts.published = ?", tag.ID, true).
			Count(&count)

		tagData[i] = TagWithCountData{
			ID:        tag.ID,
			Name:      tag.Name,
			Color:     tag.Color,
			PostCount: int(count),
		}
	}

	// Get base data
	blogName, blogDescription, baseURL, _ := h.getBaseData(c)

	data := TagListData{
		BlogName:        blogName,
		BlogDescription: blogDescription,
		BaseURL:         baseURL,
		Year:            time.Now().Year(),
		Tags:            tagData,
	}

	if err := h.templates.ExecuteTemplate(c.Writer, "tag-list.gohtml", data); err != nil {
		log.Printf("Error rendering template: %v", err)
		c.String(http.StatusInternalServerError, "Error rendering page")
	}
}

// RenderTagPosts renders posts for a specific tag
func (h *TemplateHandler) RenderTagPosts(c *gin.Context) {
	tagID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.String(http.StatusBadRequest, "Invalid tag ID")
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	if page < 1 {
		page = 1
	}
	limit := 10

	// Get tag
	var tag models.Tag
	if err := h.db.First(&tag, tagID).Error; err != nil {
		c.String(http.StatusNotFound, "Tag not found")
		return
	}

	// Get posts with this tag
	var posts []models.Post
	var total int64

	offset := (page - 1) * limit
	h.db.Model(&models.Post{}).
		Joins("JOIN post_tags ON post_tags.post_id = posts.id").
		Where("post_tags.tag_id = ? AND posts.published = ?", tagID, true).
		Count(&total)

	h.db.Joins("JOIN post_tags ON post_tags.post_id = posts.id").
		Where("post_tags.tag_id = ? AND posts.published = ?", tagID, true).
		Preload("Tags").
		Order("posts.created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&posts)

	// Convert posts to template data
	postData := make([]PostData, len(posts))
	for i, post := range posts {
		postData[i] = convertPostToData(post)
	}

	// Calculate pagination
	totalPages := int((total + int64(limit) - 1) / int64(limit))
	pagination := calculatePagination(page, totalPages)
	pagination.Total = int(total)

	// Get base data
	blogName, blogDescription, baseURL, _ := h.getBaseData(c)

	tagDataSingle := &TagData{
		ID:    tag.ID,
		Name:  tag.Name,
		Color: tag.Color,
	}

	data := TagListData{
		BlogName:        blogName,
		BlogDescription: blogDescription,
		BaseURL:         baseURL,
		Year:            time.Now().Year(),
		Tag:             tagDataSingle,
		Posts:           postData,
		Pagination:      pagination,
	}

	if err := h.templates.ExecuteTemplate(c.Writer, "tag-list.gohtml", data); err != nil {
		log.Printf("Error rendering template: %v", err)
		c.String(http.StatusInternalServerError, "Error rendering page")
	}
}

// HandleCommentSubmit handles comment form submission
func (h *TemplateHandler) HandleCommentSubmit(c *gin.Context) {
	slug := c.Param("slug")

	// Get the post
	var post models.Post
	if err := h.db.Where("slug = ? AND published = ?", slug, true).First(&post).Error; err != nil {
		c.Redirect(http.StatusSeeOther, "/posts/"+slug)
		return
	}

	// Get form data
	name := c.PostForm("name")
	email := c.PostForm("email")
	content := c.PostForm("content")

	// Create comment
	comment := models.Comment{
		PostID:    post.ID,
		Name:      name,
		Email:     email,
		Content:   content,
		Status:    "pending",
		IPAddress: c.ClientIP(),
		Referer:   c.Request.Referer(),
	}

	if err := h.db.Create(&comment).Error; err != nil {
		log.Printf("Error creating comment: %v", err)
	}

	// Redirect back to post
	c.Redirect(http.StatusSeeOther, "/posts/"+slug)
}
