export type UserRole = 'admin' | 'member'
export type ProjectRole = 'owner' | 'admin' | 'member'
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface User {
  id: number
  email: string
  username: string
  full_name: string | null
  role: UserRole
  created_at: string
}

export interface ProjectMember {
  id: number
  user: User
  role: ProjectRole
  joined_at: string
}

export interface Project {
  id: number
  name: string
  description: string | null
  color: string
  created_at: string
  updated_at: string
  members: ProjectMember[]
}

export interface Task {
  id: number
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  position: number
  due_date: string | null
  project_id: number
  assignee_id: number | null
  assignee: User | null
  created_by: User | null
  created_at: string
  updated_at: string
}

export interface Token {
  access_token: string
  token_type: string
}
