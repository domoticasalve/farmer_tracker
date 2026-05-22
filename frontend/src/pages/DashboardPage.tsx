import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarCheck, CloudRain } from 'lucide-react'
import { gardensApi } from '../api/gardens'
import { tasksApi } from '../api/tasks'
import { useAuthStore } from '../stores/authStore'
import { Layout } from '../components/Layout'
import { GardenCard, NewGardenCard } from '../components/GardenCard'
import { PageLoader } from '../components/ui/Spinner'

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
        <div className="mb-6 p-4 bg-white/80 rounded-2xl border border-linen shadow-card flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-harvest/10 flex items-center justify-center shrink-0">
            <CalendarCheck size={20} className="text-harvest" />
          </div>
          <div>
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
