import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

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
    api.get<PaginatedPostsResponse>('/posts', {
      params: { page, limit, published },
    }),
  
  getPost: (idOrSlug: string | number) =>
    api.get<BlogPost>(`/posts/${idOrSlug}`),
  
  createPost: (data: CreatePostRequest) =>
    api.post<BlogPost>('/posts', data),
  
  updatePost: (id: number, data: UpdatePostRequest) =>
    api.put<BlogPost>(`/posts/${id}`, data),
  
  deletePost: (id: number) =>
    api.delete(`/posts/${id}`),
}

// Settings API
export const settingsAPI = {
  getConfig: () =>
    api.get<Config>('/config'),

  updateConfig: (data: UpdateConfigRequest) =>
    api.put('/settings/config', data),

  updatePassword: (data: UpdatePasswordRequest) =>
    api.put('/settings/password', data),
}

// Tags API
export const tagsAPI = {
  getAllTags: () =>
    api.get<{ tags: Tag[] }>('/tags'),

  getTag: (id: number) =>
    api.get<{ tag: Tag }>(`/tags/${id}`),

  createTag: (data: CreateTagRequest) =>
    api.post<{ tag: Tag }>('/tags', data),

  updateTag: (id: number, data: UpdateTagRequest) =>
    api.put<{ tag: Tag }>(`/tags/${id}`, data),

  deleteTag: (id: number) =>
    api.delete(`/tags/${id}`),
}