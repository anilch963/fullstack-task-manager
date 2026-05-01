import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { format } from 'date-fns'
import type { Task } from '@/types'

const PRIORITY_STYLES: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
}

interface Props {
  task: Task
  onEdit: () => void
  onDelete: () => void
}

export default function TaskCard({ task, onEdit, onDelete }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-lg shadow-sm border border-gray-100 p-3 cursor-grab active:cursor-grabbing group select-none"
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-gray-800 leading-snug">{task.title}</p>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit() }}
            className="text-gray-400 hover:text-primary-600 text-xs px-1"
          >
            Edit
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            className="text-gray-400 hover:text-red-500 text-xs px-1"
          >
            Del
          </button>
        </div>
      </div>

      {task.description && (
        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center justify-between mt-2 gap-2">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_STYLES[task.priority]}`}>
          {task.priority}
        </span>
        <div className="flex items-center gap-1.5">
          {task.due_date && (
            <span className="text-xs text-gray-400">
              {format(new Date(task.due_date), 'MMM d')}
            </span>
          )}
          {task.assignee && (
            <div
              className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 text-xs flex items-center justify-center font-bold"
              title={task.assignee.username}
            >
              {task.assignee.username[0].toUpperCase()}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
