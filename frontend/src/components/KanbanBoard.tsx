import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useState } from 'react'
import TaskCard from './TaskCard'
import type { Task, ProjectMember, TaskStatus } from '@/types'

const COLUMNS: { id: TaskStatus; label: string; color: string; dot: string }[] = [
  { id: 'todo', label: 'To Do', color: 'bg-gray-100', dot: 'bg-gray-400' },
  { id: 'in_progress', label: 'In Progress', color: 'bg-blue-50', dot: 'bg-blue-500' },
  { id: 'review', label: 'Review', color: 'bg-yellow-50', dot: 'bg-yellow-500' },
  { id: 'done', label: 'Done', color: 'bg-green-50', dot: 'bg-green-500' },
]

interface Props {
  tasks: Task[]
  members: ProjectMember[]
  onUpdateTask: (id: number, data: Partial<Task>) => void
  onDeleteTask: (id: number) => void
  onEditTask: (task: Task) => void
}

export default function KanbanBoard({ tasks, onUpdateTask, onDeleteTask, onEditTask }: Props) {
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const tasksByStatus = (status: TaskStatus) =>
    tasks.filter((t) => t.status === status).sort((a, b) => a.position - b.position)

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => t.id === Number(event.active.id))
    setActiveTask(task ?? null)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null)
    const { active, over } = event
    if (!over || active.id === over.id) return

    const taskId = Number(active.id)
    const overId = String(over.id)
    const isColumn = COLUMNS.some((c) => c.id === overId)

    if (isColumn) {
      onUpdateTask(taskId, { status: overId as TaskStatus })
    } else {
      const overTask = tasks.find((t) => t.id === Number(overId))
      if (overTask) {
        onUpdateTask(taskId, { status: overTask.status, position: overTask.position })
      }
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 min-h-[600px]">
        {COLUMNS.map((col) => {
          const colTasks = tasksByStatus(col.id)
          return (
            <div
              key={col.id}
              id={col.id}
              className={`flex-1 min-w-[220px] rounded-xl ${col.color} p-4 flex flex-col`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${col.dot}`} />
                  <h3 className="font-semibold text-gray-700 text-sm">{col.label}</h3>
                </div>
                <span className="text-xs text-gray-400 bg-white rounded-full px-2 py-0.5 font-medium">
                  {colTasks.length}
                </span>
              </div>
              <SortableContext items={colTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col gap-2 flex-1 min-h-[80px]">
                  {colTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onEdit={() => onEditTask(task)}
                      onDelete={() => onDeleteTask(task.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </div>
          )
        })}
      </div>
      <DragOverlay>
        {activeTask && (
          <TaskCard task={activeTask} onEdit={() => {}} onDelete={() => {}} />
        )}
      </DragOverlay>
    </DndContext>
  )
}
