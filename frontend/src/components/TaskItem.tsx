import { useState } from 'react'
import { CheckCircle2, CloudRain, SkipForward, Circle } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { tasksApi } from '../api/tasks'
import { TASK_META, cn, formatDateShort, daysUntil } from '../lib/utils'
import type { Task } from '../types'

interface TaskItemProps {
  task: Task
  queryKey: unknown[]
  compact?: boolean
}

export function TaskItem({ task, queryKey, compact = false }: TaskItemProps) {
  const qc = useQueryClient()
  const [justCompleted, setJustCompleted] = useState(false)
  const meta = TASK_META[task.action_type]

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey })
    qc.invalidateQueries({ queryKey: ['tasks'] })
  }

  const complete = useMutation({
    mutationFn: () => tasksApi.complete(task.id),
    onSuccess: () => {
      setJustCompleted(true)
      invalidateAll()
    }
  })

  const skip = useMutation({
    mutationFn: () => tasksApi.skip(task.id),
    onSuccess: invalidateAll
  })

  const unskip = useMutation({
    mutationFn: () => tasksApi.uncomplete(task.id),
    onSuccess: invalidateAll
  })

  const isCompleted = !!task.completed_at
  const isSkipped   = task.skipped
  const daysDiff    = daysUntil(task.scheduled_date)
  const isOverdue   = !isCompleted && !isSkipped && daysDiff < 0

  return (
    <div className={cn(
      'flex items-start gap-3 rounded-xl p-3 transition-all duration-200',
      isCompleted ? 'bg-sage-50/60 opacity-70' : isSkipped ? 'bg-stone-50/60 opacity-60' : 'bg-white/80',
      compact ? 'py-2' : '',
      isOverdue ? 'border border-red-200 bg-red-50/40' : 'border border-transparent'
    )}>
      {/* Checkbox / state */}
      <button
        disabled={isCompleted || complete.isPending || unskip.isPending}
        onClick={() => isSkipped ? unskip.mutate() : complete.mutate()}
        className="mt-0.5 flex-shrink-0 focus:outline-none"
        aria-label={isSkipped ? 'Deshacer salto' : 'Marcar como completada'}
        title={isSkipped ? 'Clic para deshacer salto' : undefined}
      >
        {isCompleted ? (
          <CheckCircle2
            size={20}
            className={cn('text-sage-500', justCompleted && 'check-anim')}
          />
        ) : isSkipped ? (
          <span className={cn('hover:text-stone-600 transition-colors', unskip.isPending && 'animate-pulse')}>
            {task.auto_skipped_by_rain
              ? <CloudRain size={20} className="text-water-400" />
              : <SkipForward size={20} className="text-stone-400 hover:text-harvest" />
            }
          </span>
        ) : (
          <Circle size={20} className={cn('text-stone-300 hover:text-sage-400 transition-colors', complete.isPending && 'animate-pulse')} />
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn(
            'text-sm font-medium',
            isCompleted || isSkipped ? 'line-through text-stone-400' : 'text-forest'
          )}>
            {task.title}
          </span>
          <span className={cn(
            'task-chip shrink-0',
            meta.bg, meta.border, meta.text
          )}>
            <span>{meta.icon}</span>
            {!compact && meta.label}
          </span>
          {task.auto_skipped_by_rain && (
            <span className="task-chip bg-sky-50 border-sky-200 text-sky-700">
              <CloudRain size={10} /> Lluvia
            </span>
          )}
        </div>

        {!compact && (
          <div className="mt-1 flex items-center gap-3">
            <span className={cn(
              'text-xs',
              isOverdue ? 'text-red-500 font-medium' :
              daysDiff === 0 ? 'text-harvest font-medium' :
              'text-stone-400'
            )}>
              {isCompleted
                ? `Completada el ${formatDateShort(task.completed_at!)}`
                : isOverdue
                  ? `Atrasada ${Math.abs(daysDiff)}d`
                  : daysDiff === 0
                    ? 'Hoy'
                    : daysDiff === 1
                      ? 'Mañana'
                      : formatDateShort(task.scheduled_date)
              }
            </span>
          </div>
        )}
      </div>

      {/* Skip button */}
      {!isCompleted && !isSkipped && !compact && (
        <button
          onClick={() => skip.mutate()}
          disabled={skip.isPending}
          className="shrink-0 rounded-lg p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
          title="Saltar tarea"
        >
          <SkipForward size={14} />
        </button>
      )}
    </div>
  )
}
