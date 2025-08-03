export interface User {
  id: string
  username: string // Backend uses username, not full_name
  email: string
  role: string
  password?: string
  is_email_verified: boolean
  created_at: string
  updated_at?: string
}

export interface CreateUserRequest {
  username: string
  email: string
  password: string
  role: string
  is_email_verified: boolean
}

export interface UpdateUserRequest {
  id: string
  email?: string
  full_name?: string // Frontend sends full_name, backend maps to username
  role?: string
  password?: string
  isEmailVerified?: boolean
}
