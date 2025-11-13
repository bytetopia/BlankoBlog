import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || (
  import.meta.env.DEV ? 'http://localhost:8080' : window.location.origin
)

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
      // Could trigger a redirect to login page here
    }
    return Promise.reject(error)
  }
)

export interface BlogPost {
  id: number
  title: string
  content: string
  summary: string
  slug: string
  published: boolean
  view_count: number
  tags: Tag[]
  created_at: string
  updated_at: string
}

export interface Tag {
  id: number
  name: string
  color: string
  created_at: string
  updated_at: string
}

export interface TagWithPostCount {
  id: number
  name: string
  color: string
  post_count: number
  created_at: string
  updated_at: string
}

export interface Comment {
  id: number
  post_id: number
  name: string
  email?: string
  content: string
  status: string
  created_at: string
}

export interface CommentAdmin {
  id: number
  post_id: number
  post_title?: string
  name: string
  email: string
  content: string
  status: string
  ip_address: string
  referer: string
  created_at: string
  updated_at: string
}

export interface CreateCommentRequest {
  post_id: number
  name: string
  email?: string
  content: string
}

export interface UpdateCommentStatusRequest {
  status: 'pending' | 'approved' | 'hidden'
}

export interface CommentStats {
  pending: number
  approved: number
  hidden: number
  total: number
}

export interface User {
  id: number
  username: string
  email: string
  is_admin: boolean
}

export interface Config {
  configs: Record<string, string>
}

export interface UpdateConfigRequest {
  configs: Record<string, string>
}

export interface UpdatePasswordRequest {
  current_password: string
  new_password: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
}

export interface CreatePostRequest {
  title: string
  content: string
  summary?: string
  slug?: string
  published: boolean
  tag_ids?: number[]
}

export interface UpdatePostRequest {
  title?: string
  content?: string
  summary?: string
  slug?: string
  published?: boolean
  tag_ids?: number[]
}

export interface CreateTagRequest {
  name: string
  color?: string
}

export interface UpdateTagRequest {
  name?: string
  color?: string
}

export interface PaginatedPostsResponse {
  posts: BlogPost[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}

// Auth API
export const authAPI = {
  login: (credentials: LoginRequest) =>
    api.post<LoginResponse>('/auth/login', credentials),
}

// Posts API
export const postsAPI = {
  getPosts: (page = 1, limit = 10, published = true) =>
    api.get<PaginatedPostsResponse>('/public/posts', {
      params: { page, limit, published },
    }),
  
  // Public post endpoint with view count increment
  getPublicPost: (idOrSlug: string | number) =>
    api.get<BlogPost>(`/public/posts/${idOrSlug}`),
  
  // Admin post endpoint without view count increment
  getAdminPost: (idOrSlug: string | number) =>
    api.get<BlogPost>(`/admin/posts/${idOrSlug}`),
  
  createPost: (data: CreatePostRequest) =>
    api.post<BlogPost>('/admin/posts', data),
  
  updatePost: (id: number, data: UpdatePostRequest) =>
    api.put<BlogPost>(`/admin/posts/${id}`, data),
  
  deletePost: (id: number) =>
    api.delete(`/admin/posts/${id}`),
}

// Settings API
export const settingsAPI = {
  getConfig: () =>
    api.get<Config>('/public/config'),

  updateConfig: (data: UpdateConfigRequest) =>
    api.put('/admin/settings/config', data),

  updatePassword: (data: UpdatePasswordRequest) =>
    api.put('/admin/settings/password', data),
}

// Tags API
export const tagsAPI = {
  getAllTags: () =>
    api.get<{ tags: Tag[] }>('/public/tags'),

  getAllTagsWithPostCount: () =>
    api.get<{ tags: TagWithPostCount[] }>('/public/tags/with-counts'),

  getTag: (id: number) =>
    api.get<{ tag: Tag }>(`/public/tags/${id}`),

  getPostsByTag: (tagId: number, page = 1, limit = 10, published = true) =>
    api.get<PaginatedPostsResponse>(`/public/tags/${tagId}/posts`, {
      params: { page, limit, published },
    }),

  createTag: (data: CreateTagRequest) =>
    api.post<{ tag: Tag }>('/admin/tags', data),

  updateTag: (id: number, data: UpdateTagRequest) =>
    api.put<{ tag: Tag }>(`/admin/tags/${id}`, data),

  deleteTag: (id: number) =>
    api.delete(`/admin/tags/${id}`),
}

// Comments API
export const commentsAPI = {
  // Public endpoints
  createComment: (data: CreateCommentRequest) =>
    api.post<{ message: string; comment: Comment }>('/public/comments', data),

  getCommentsByPostId: (postId: number) =>
    api.get<{ comments: Comment[] }>(`/public/posts/${postId}/comments`),

  // Admin endpoints
  getAllCommentsForAdmin: (page = 1, limit = 20, status?: string) =>
    api.get<{ 
      comments: CommentAdmin[]; 
      pagination: { 
        current_page: number; 
        total_pages: number; 
        total_count: number; 
        limit: number 
      } 
    }>('/admin/comments/list', {
      params: { page, limit, ...(status && { status }) },
    }),

  getCommentForAdmin: (id: number) =>
    api.get<{ comment: CommentAdmin }>(`/admin/comments/${id}`),

  updateCommentStatus: (id: number, data: UpdateCommentStatusRequest) =>
    api.put<{ message: string }>(`/admin/comments/${id}/status`, data),

  deleteComment: (id: number) =>
    api.delete<{ message: string }>(`/admin/comments/${id}`),

  getCommentStats: () =>
    api.get<{ stats: CommentStats }>('/admin/comments/stats'),
}