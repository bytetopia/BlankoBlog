# API Documentation

## Base URL
```
http://localhost:8080/api
```

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

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

### Blog Posts

#### GET /posts
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

#### GET /posts/:id
Get a specific blog post by ID or slug.

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

#### POST /posts (Admin Only)
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

#### PUT /posts/:id (Admin Only)
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

#### DELETE /posts/:id (Admin Only)
Delete a blog post (soft delete).

**Response:**
```json
{
  "message": "Post deleted successfully"
}
```

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