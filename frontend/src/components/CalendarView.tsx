import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, CloudRain, LayoutGrid, AlignJustify } from 'lucide-react'
import {
  startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  eachDayOfInterval, format, isSameDay, isToday,
  addWeeks, subWeeks, addMonths, subMonths, isSameMonth
} from 'date-fns'
import { es } from 'date-fns/locale'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { tasksApi } from '../api/tasks'
import { TASK_META, cn } from '../lib/utils'
import type { Task } from '../types'

interface CalendarViewProps {
  tasks: Task[]
  gardenId: number
}

type ViewMode = 'week' | 'month'

export function CalendarView({ tasks, gardenId }: CalendarViewProps) {
  const [mode, setMode] = useState<ViewMode>('week')
  const [current, setCurrent] = useState(new Date())
  const qc = useQueryClient()

  const complete = useMutation({
    mutationFn: (id: number) => tasksApi.complete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', gardenId] })
  })

  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {}
    tasks.forEach(t => {
      if (!map[t.scheduled_date]) map[t.scheduled_date] = []
      map[t.scheduled_date].push(t)
    })
    return map
  }, [tasks])

  const days = useMemo(() => {
    if (mode === 'week') {
      return eachDayOfInterval({
        start: startOfWeek(current, { weekStartsOn: 1 }),
        end:   endOfWeek(current,   { weekStartsOn: 1 })
      })
    }
    return eachDayOfInterval({
      start: startOfWeek(startOfMonth(current), { weekStartsOn: 1 }),
      end:   endOfWeek(endOfMonth(current),     { weekStartsOn: 1 })
    })
  }, [mode, current])

  const prev = () => mode === 'week' ? setCurrent(subWeeks(current, 1)) : setCurrent(subMonths(current, 1))
  const next = () => mode === 'week' ? setCurrent(addWeeks(current, 1)) : setCurrent(addMonths(current, 1))

  const periodLabel = mode === 'week'
    ? `${format(days[0], 'd MMM', { locale: es })} — ${format(days[6], 'd MMM yyyy', { locale: es })}`
    : format(current, 'MMMM yyyy', { locale: es })

  return (
    <div className="flex flex-col gap-4">
      {/* Controls */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button onClick={prev} className="p-1.5 rounded-lg hover:bg-parchment transition-colors">
            <ChevronLeft size={18} className="text-sage-600" />
          </button>
          <span className="text-sm font-medium text-forest min-w-[180px] text-center capitalize">
            {periodLabel}
          </span>
          <button onClick={next} className="p-1.5 rounded-lg hover:bg-parchment transition-colors">
            <ChevronRight size={18} className="text-sage-600" />
          </button>
        </div>

        <div className="flex gap-1 bg-parchment rounded-lg p-0.5">
          {(['week', 'month'] as ViewMode[]).map(v => (
            <button
              key={v}
              onClick={() => setMode(v)}
              className={cn(
                'p-1.5 rounded-md transition-all',
                mode === v ? 'bg-fern text-cream shadow-sm' : 'text-sage-600 hover:bg-linen'
              )}
              title={v === 'week' ? 'Vista semana' : 'Vista mes'}
            >
              {v === 'week' ? <AlignJustify size={14} /> : <LayoutGrid size={14} />}
            </button>
          ))}
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1">
        {['L','M','X','J','V','S','D'].map(d => (
          <div key={d} className="text-center text-xs font-semibold text-stone-400 py-1">{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className={cn('grid grid-cols-7 gap-1', mode === 'month' ? 'gap-y-1' : 'gap-y-2')}>
        {days.map(day => {
          const dateKey = format(day, 'yyyy-MM-dd')
          const dayTasks = tasksByDate[dateKey] ?? []
          const isCurrentMonth = isSameMonth(day, current)
          const today = isToday(day)

          return (
            <div
              key={dateKey}
              className={cn(
                'min-h-[60px] rounded-xl p-1.5 transition-colors',
                mode === 'month' ? 'min-h-[72px]' : 'min-h-[80px]',
                today ? 'bg-sage-50 ring-1 ring-sage-300' : 'bg-white/60',
                !isCurrentMonth && mode === 'month' ? 'opacity-30' : ''
              )}
            >
              <div className={cn(
                'text-xs font-medium mb-1.5 w-6 h-6 flex items-center justify-center rounded-full',
                today ? 'bg-fern text-cream' : 'text-stone-500'
              )}>
                {format(day, 'd')}
              </div>

              <div className="flex flex-col gap-0.5 overflow-hidden">
                {dayTasks.slice(0, mode === 'month' ? 2 : 4).map(task => {
                  const meta = TASK_META[task.action_type]
                  const done = !!task.completed_at
                  return (
                    <button
                      key={task.id}
                      disabled={done || task.skipped || complete.isPending}
                      onClick={() => !done && !task.skipped && complete.mutate(task.id)}
                      className={cn(
                        'task-chip w-full justify-start truncate cursor-pointer',
                        meta.bg, meta.border, meta.text,
                        done || task.skipped ? 'opacity-50 line-through cursor-default' : 'hover:brightness-95'
                      )}
                      title={task.title}
                    >
                      {task.auto_skipped_by_rain
                        ? <CloudRain size={9} className="text-water-500 shrink-0" />
                        : <span className="shrink-0">{meta.icon}</span>
                      }
                      <span className="truncate">{task.title.split('—')[0].trim()}</span>
                    </button>
                  )
                })}
                {dayTasks.length > (mode === 'month' ? 2 : 4) && (
                  <span className="text-xs text-stone-400 pl-1">
                    +{dayTasks.length - (mode === 'month' ? 2 : 4)} más
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-linen">
        {Object.entries(TASK_META).map(([type, meta]) => (
          <span key={type} className={cn('task-chip', meta.bg, meta.border, meta.text)}>
            {meta.icon} {meta.label}
          </span>
        ))}
      </div>
    </div>
  )
}
