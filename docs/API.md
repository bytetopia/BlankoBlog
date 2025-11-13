# API Documentation

## Base URL
```
http://localhost:8080/api
```

## Authentication
Admin endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## API Structure

- **Public endpoints**: `/api/public/*` - No authentication required
- **Admin endpoints**: `/api/admin/*` - Authentication required
- **Auth endpoints**: `/api/auth/*` - Authentication endpoints

## Endpoints

### Authentication

#### POST /auth/login
Login with admin credentials.

**Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "token": "jwt-token-string",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@blankoblog.com",
    "is_admin": true
  }
}
```

### Public Blog Posts

#### GET /public/posts
Get paginated list of published blog posts.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Posts per page (default: 10)
- `published` (optional): Filter by published status (default: true)

**Response:**
```json
{
  "posts": [
    {
      "id": 1,
      "title": "Welcome to Blanko Blog",
      "content": "This is your first blog post...",
      "summary": "Welcome to your new blog system",
      "slug": "welcome-to-blanko-blog",
      "published": true,
      "created_at": "2024-01-01T12:00:00Z",
      "updated_at": "2024-01-01T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "total_pages": 1
  }
}
```

#### GET /public/posts/:id
Get a specific blog post by ID or slug (increments view count).

**Response:**
```json
{
  "id": 1,
  "title": "Welcome to Blanko Blog",
  "content": "This is your first blog post...",
  "summary": "Welcome to your new blog system",
  "slug": "welcome-to-blanko-blog",
  "published": true,
  "created_at": "2024-01-01T12:00:00Z",
  "updated_at": "2024-01-01T12:00:00Z"
}
```

#### GET /public/tags
Get all tags.

#### GET /public/tags/with-counts
Get all tags with post counts.

#### GET /public/tags/:id
Get a specific tag.

#### GET /public/tags/:id/posts
Get posts by tag ID.

#### GET /public/config
Get public blog configuration (name, description, etc.).

#### POST /public/comments
Create a new comment on a post.

#### GET /public/posts/:id/comments
Get approved comments for a specific post.

### Admin Blog Posts

#### GET /admin/posts/:id
Get a specific blog post by ID or slug (admin view, no view count increment).

#### POST /admin/posts
Create a new blog post.

**Request Body:**
```json
{
  "title": "My New Post",
  "content": "This is the content of my new post...",
  "summary": "A brief summary of the post",
  "published": true
}
```

**Response:**
```json
{
  "id": 2,
  "title": "My New Post",
  "content": "This is the content of my new post...",
  "summary": "A brief summary of the post",
  "slug": "my-new-post",
  "published": true,
  "created_at": "2024-01-01T12:00:00Z",
  "updated_at": "2024-01-01T12:00:00Z"
}
```

#### PUT /admin/posts/:id
Update an existing blog post.

**Request Body:**
```json
{
  "title": "Updated Post Title",
  "content": "Updated content...",
  "summary": "Updated summary",
  "published": false
}
```

#### DELETE /admin/posts/:id
Delete a blog post (soft delete).

**Response:**
```json
{
  "message": "Post deleted successfully"
}
```

### Admin Tags

#### POST /admin/tags
Create a new tag.

#### PUT /admin/tags/:id
Update an existing tag.

#### DELETE /admin/tags/:id
Delete a tag.

### Admin Comments

#### GET /admin/comments/list
Get all comments for admin management.

#### GET /admin/comments/stats
Get comment statistics.

#### GET /admin/comments/:id
Get a specific comment for admin.

#### PUT /admin/comments/:id/status
Update comment status.

#### DELETE /admin/comments/:id
Delete a comment.

### Admin Settings

#### PUT /admin/settings/config
Update blog configuration.

#### PUT /admin/settings/password
Update admin password.

## Error Responses

All endpoints return errors in the following format:
```json
{
  "error": "Error message description"
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error