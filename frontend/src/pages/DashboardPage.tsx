import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Link } from 'react-router-dom'
import { CalendarCheck, CloudRain, ChevronDown, ChevronUp } from 'lucide-react'
import { gardensApi } from '../api/gardens'
import { tasksApi } from '../api/tasks'
import { useAuthStore } from '../stores/authStore'
import { Layout } from '../components/Layout'
import { GardenCard, NewGardenCard } from '../components/GardenCard'
import { PageLoader } from '../components/ui/Spinner'
import { TASK_META, cn } from '../lib/utils'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const today = format(new Date(), 'yyyy-MM-dd')

  const { data: gardens, isLoading: loadingGardens } = useQuery({
    queryKey: ['gardens'],
    queryFn: gardensApi.list,
  })

  const { data: todayTasks } = useQuery({
    queryKey: ['tasks', 'today'],
    queryFn: () => tasksApi.list({ from_date: today, to_date: today, pending_only: true }),
  })


  const [tasksExpanded, setTasksExpanded] = useState(true)
  const qc = useQueryClient()

  const complete = useMutation({
    mutationFn: (id: number) => tasksApi.complete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', 'today'] })
      qc.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  const pendingCount = todayTasks?.length ?? 0
  const rainSkippedCount = todayTasks?.filter(t => t.auto_skipped_by_rain).length ?? 0

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Buenos días'
    if (h < 20) return 'Buenas tardes'
    return 'Buenas noches'
  }

  return (
    <Layout>
      {/* Greeting */}
      <div className="mb-6">
        <p className="text-sm text-sage-600 mb-0.5 capitalize">
          {format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}
        </p>
        <h1 className="font-display text-2xl font-bold text-forest">
          {greeting()}{user?.name ? `, ${user.name.split(' ')[0]}` : ''} 👋
        </h1>
      </div>

      {/* Today summary */}
      {pendingCount > 0 && (
        <div className="mb-6 bg-white/80 rounded-2xl border border-linen shadow-card overflow-hidden">
          <button
            onClick={() => setTasksExpanded(e => !e)}
            className="w-full p-4 flex items-center gap-3 hover:bg-parchment/50 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-harvest/10 flex items-center justify-center shrink-0">
              <CalendarCheck size={20} className="text-harvest" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-forest text-sm">
                {pendingCount} tarea{pendingCount !== 1 ? 's' : ''} pendiente{pendingCount !== 1 ? 's' : ''} hoy
              </p>
              {rainSkippedCount > 0 && (
                <p className="text-xs text-water-500 mt-0.5 flex items-center gap-1">
                  <CloudRain size={12} />
                  {rainSkippedCount} saltadas por lluvia prevista
                </p>
              )}
            </div>
            {tasksExpanded ? <ChevronUp size={16} className="text-stone-400" /> : <ChevronDown size={16} className="text-stone-400" />}
          </button>

          {tasksExpanded && (
            <div className="border-t border-linen divide-y divide-linen">
              {todayTasks?.map(task => {
                const meta = TASK_META[task.action_type]
                const done = !!task.completed_at
                return (
                  <div key={task.id} className="flex items-center gap-3 px-4 py-2.5">
                    <button
                      disabled={done || task.skipped || complete.isPending}
                      onClick={() => !done && !task.skipped && complete.mutate(task.id)}
                      className={cn(
                        'shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
                        done ? 'bg-sage-400 border-sage-400' : 'border-stone-300 hover:border-sage-400'
                      )}
                    >
                      {done && <span className="text-white text-xs">✓</span>}
                    </button>
                    <span className={cn('task-chip shrink-0', meta.bg, meta.border, meta.text)}>
                      {task.auto_skipped_by_rain ? <CloudRain size={10} /> : <span>{meta.icon}</span>}
                      {meta.label}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className={cn('text-sm text-forest truncate block', done && 'line-through text-stone-400')}>
                        {task.title.split('—')[1]?.trim() ?? task.title}
                      </span>
                      <Link
                        to={`/gardens/${task.garden_id}`}
                        className="text-xs text-sage-600 hover:underline"
                        onClick={e => e.stopPropagation()}
                      >
                        {task.garden_name}
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Gardens */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-forest">Mis huertos</h2>
        <span className="text-xs text-stone-400">{gardens?.length ?? 0} huerto{(gardens?.length ?? 0) !== 1 ? 's' : ''}</span>
      </div>

      {loadingGardens ? (
        <PageLoader />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {gardens?.map(garden => (
            <GardenCard
              key={garden.id}
              garden={garden}
              plantCount={garden.plant_count}
              pendingTaskCount={todayTasks?.length ?? 0}
            />
          ))}
          <NewGardenCard />
        </div>
      )}
    </Layout>
  )
}
