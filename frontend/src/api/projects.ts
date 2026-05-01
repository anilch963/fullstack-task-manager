import client from './client'
import type { Project, ProjectMember, ProjectRole } from '@/types'

export const projectsApi = {
  list: () => client.get<Project[]>('/projects').then((r) => r.data),
  get: (id: number) => client.get<Project>(`/projects/${id}`).then((r) => r.data),
  create: (data: { name: string; description?: string; color?: string }) =>
    client.post<Project>('/projects', data).then((r) => r.data),
  update: (id: number, data: Partial<{ name: string; description: string; color: string }>) =>
    client.patch<Project>(`/projects/${id}`, data).then((r) => r.data),
  delete: (id: number) => client.delete(`/projects/${id}`),
  addMember: (projectId: number, userId: number, role: ProjectRole = 'member') =>
    client.post<ProjectMember>(`/projects/${projectId}/members`, { user_id: userId, role }).then((r) => r.data),
  removeMember: (projectId: number, userId: number) =>
    client.delete(`/projects/${projectId}/members/${userId}`),
}
