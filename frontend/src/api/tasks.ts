import client from './client'
import type { Task, TaskStatus, TaskPriority } from '@/types'

export const tasksApi = {
  list: (projectId: number, params?: { status?: TaskStatus; assignee_id?: number }) =>
    client.get<Task[]>('/tasks', { params: { project_id: projectId, ...params } }).then((r) => r.data),

  get: (id: number) => client.get<Task>(`/tasks/${id}`).then((r) => r.data),

  create: (data: {
    title: string
    project_id: number
    description?: string
    status?: TaskStatus
    priority?: TaskPriority
    due_date?: string
    assignee_id?: number
  }) => client.post<Task>('/tasks', data).then((r) => r.data),

  update: (
    id: number,
    data: Partial<{
      title: string
      description: string
      status: TaskStatus
      priority: TaskPriority
      due_date: string
      assignee_id: number
      position: number
    }>
  ) => client.patch<Task>(`/tasks/${id}`, data).then((r) => r.data),

  delete: (id: number) => client.delete(`/tasks/${id}`),
}
