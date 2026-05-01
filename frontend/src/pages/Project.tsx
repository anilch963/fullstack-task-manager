import { useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { projectsApi } from '@/api/projects'
import { tasksApi } from '@/api/tasks'
import { useAuthStore } from '@/store/authStore'
import { useWebSocket } from '@/hooks/useWebSocket'
import KanbanBoard from '@/components/KanbanBoard'
import TaskModal from '@/components/TaskModal'
import type { Task } from '@/types'

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>()
  const projectId = Number(id)
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const qc = useQueryClient()
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsApi.get(projectId),
  })

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => tasksApi.list(projectId),
  })

  useWebSocket(
    projectId,
    useCallback(() => {
      qc.invalidateQueries({ queryKey: ['tasks', projectId] })
    }, [projectId, qc])
  )

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, ...data }: Partial<Task> & { id: number }) => tasksApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', projectId] }),
    onError: () => toast.error('Failed to update task'),
  })

  const deleteTaskMutation = useMutation({
    mutationFn: tasksApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', projectId] })
      toast.success('Task deleted')
    },
  })

  const closeModal = () => {
    setShowCreate(false)
    setEditingTask(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/" className="text-gray-400 hover:text-gray-700 text-sm shrink-0">
            ← Projects
          </Link>
          {project && (
            <>
              <span className="text-gray-300">/</span>
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: project.color }} />
                <h1 className="font-bold text-gray-900 truncate">{project.name}</h1>
              </div>
            </>
          )}
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <button
            onClick={() => setShowCreate(true)}
            className="bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-700 transition text-sm font-medium"
          >
            + Add Task
          </button>
          <span className="text-sm text-gray-600 hidden sm:block">{user?.username}</span>
          <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-900 transition">
            Sign out
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="text-center py-12 text-gray-400">Loading tasks…</div>
        ) : (
          <KanbanBoard
            tasks={tasks}
            members={project?.members ?? []}
            onUpdateTask={(taskId, data) => updateTaskMutation.mutate({ id: taskId, ...data })}
            onDeleteTask={(taskId) => deleteTaskMutation.mutate(taskId)}
            onEditTask={setEditingTask}
          />
        )}
      </div>

      {(showCreate || editingTask) && (
        <TaskModal
          projectId={projectId}
          task={editingTask}
          members={project?.members ?? []}
          onClose={closeModal}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ['tasks', projectId] })
            closeModal()
          }}
        />
      )}
    </div>
  )
}
