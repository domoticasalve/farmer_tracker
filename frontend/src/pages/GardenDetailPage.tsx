import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Pencil, Plus, MapPin, Sprout, CloudRain } from 'lucide-react'
import { gardensApi } from '../api/gardens'
import { tasksApi } from '../api/tasks'
import { Layout } from '../components/Layout'
import { Tabs, TabList, Tab, TabPanel } from '../components/ui/Tabs'
import { CalendarView } from '../components/CalendarView'
import { Badge } from '../components/ui/Badge'
import { PageLoader } from '../components/ui/Spinner'
import { STATUS_META, CATEGORY_META, TASK_META, cn, formatDate } from '../lib/utils'

export default function GardenDetailPage() {
  const { id } = useParams<{ id: string }>()
  const gardenId = Number(id)
  const [tab, setTab] = useState('plants')

  const { data: garden, isLoading: loadingGarden } = useQuery({
    queryKey: ['garden', id],
    queryFn: () => gardensApi.get(gardenId),
  })

  const { data: gardenPlants, isLoading: loadingPlants } = useQuery({
    queryKey: ['garden-plants', gardenId],
    queryFn: () => gardensApi.plants.list(gardenId),
  })

  const today = format(new Date(), 'yyyy-MM-dd')
  const { data: todayTasks } = useQuery({
    queryKey: ['tasks', gardenId, 'today'],
    queryFn: () => tasksApi.list({ garden_id: gardenId, from_date: today, to_date: today, pending_only: true }),
  })

  const qc = useQueryClient()
  const complete = useMutation({
    mutationFn: (id: number) => tasksApi.complete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', gardenId, 'today'] })
      qc.invalidateQueries({ queryKey: ['tasks', gardenId] })
    },
  })

  if (loadingGarden) return <Layout back="/dashboard"><PageLoader /></Layout>
  if (!garden) return <Layout back="/dashboard"><p className="text-center text-stone-500 py-12">Huerto no encontrado</p></Layout>

  const activePlants = gardenPlants?.filter(p => p.status === 'active') ?? []

  return (
    <Layout
      title={garden.name}
      back="/dashboard"
      actions={
        <Link to={`/gardens/${id}/edit`} className="p-2 rounded-xl hover:bg-parchment transition-colors text-sage-600">
          <Pencil size={16} />
        </Link>
      }
    >
      {/* Garden header */}
      <div className="mb-6">
        {garden.photo_url ? (
          <div className="relative h-40 rounded-2xl overflow-hidden mb-4">
            <img src={garden.photo_url} alt={garden.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-forest/60 to-transparent" />
            <div className="absolute bottom-3 left-4">
              <h1 className="font-display text-xl font-bold text-cream">{garden.name}</h1>
              {garden.location_label && (
                <div className="flex items-center gap-1 mt-0.5">
                  <MapPin size={11} className="text-cream/70" />
                  <span className="text-xs text-cream/70">{garden.location_label}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="mb-2">
            <h1 className="font-display text-2xl font-bold text-forest">{garden.name}</h1>
            {garden.location_label && (
              <div className="flex items-center gap-1 mt-1 text-sage-600">
                <MapPin size={13} />
                <span className="text-sm">{garden.location_label}</span>
              </div>
            )}
          </div>
        )}

        {garden.description && (
          <p className="text-sm text-stone-500 leading-relaxed">{garden.description}</p>
        )}
      </div>

      {/* Today's pending tasks */}
      {todayTasks && todayTasks.length > 0 && (
        <div className="mb-5 bg-white/80 rounded-2xl border border-linen shadow-card overflow-hidden">
          <div className="px-4 py-2.5 border-b border-linen flex items-center gap-2">
            <span className="text-xs font-semibold text-stone-400 uppercase tracking-wide">Tareas de hoy</span>
            <span className="ml-auto text-xs font-medium text-harvest bg-harvest/10 px-2 py-0.5 rounded-full">
              {todayTasks.length}
            </span>
          </div>
          <div className="divide-y divide-linen">
            {todayTasks.map(task => {
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
                  <span className={cn('text-sm text-forest flex-1 truncate', done && 'line-through text-stone-400')}>
                    {task.title.split('—')[1]?.trim() ?? task.title}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={tab} onChange={setTab}>
        <TabList className="mb-5">
          <Tab value="plants">
            🌱 Plantas ({activePlants.length})
          </Tab>
          <Tab value="calendar">
            📅 Calendario
          </Tab>
        </TabList>

        {/* Plants tab */}
        <TabPanel value="plants">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-stone-500">
              {gardenPlants?.length ?? 0} planta{(gardenPlants?.length ?? 0) !== 1 ? 's' : ''} en total
            </p>
            <Link
              to={`/gardens/${id}/plants/add`}
              className="inline-flex items-center gap-1.5 bg-fern text-cream px-3 py-1.5 rounded-xl text-sm font-medium hover:bg-forest transition-colors shadow-green"
            >
              <Plus size={14} /> Añadir planta
            </Link>
          </div>

          {loadingPlants ? (
            <PageLoader />
          ) : gardenPlants?.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-stone-400">
              <Sprout size={36} className="opacity-40" />
              <p className="text-sm font-medium">Sin plantas todavía</p>
              <p className="text-xs text-center">Añade la primera planta para<br/>generar su calendario de tareas</p>
              <Link
                to={`/gardens/${id}/plants/add`}
                className="mt-2 inline-flex items-center gap-2 bg-fern text-cream px-4 py-2 rounded-xl text-sm font-medium"
              >
                <Plus size={14} /> Añadir planta
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {gardenPlants?.map(gp => {
                const statusMeta = STATUS_META[gp.status]
                const catMeta = CATEGORY_META[gp.plant.category ?? '']
                return (
                  <Link
                    key={gp.id}
                    to={`/gardens/${id}/plants/${gp.id}`}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-xl bg-white/80 border border-linen shadow-card card-lift',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-400'
                    )}
                  >
                    {/* Plant icon / image */}
                    <div className="w-12 h-12 rounded-xl bg-sage-100 flex items-center justify-center text-2xl shrink-0 overflow-hidden">
                      {gp.plant.image_url
                        ? <img src={gp.plant.image_url} alt="" className="w-full h-full object-cover" />
                        : '🌿'
                      }
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-medium text-forest text-sm truncate">{gp.plant.name_es}</span>
                        <Badge className={cn('shrink-0', statusMeta.color)}>{statusMeta.label}</Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {catMeta && <span className="text-xs text-stone-400">{catMeta.label}</span>}
                        {gp.zone_label && <span className="text-xs text-stone-400">· {gp.zone_label}</span>}
                      </div>
                      {gp.sowing_date && (
                        <p className="text-xs text-sage-600 mt-0.5">
                          Siembra: {formatDate(gp.sowing_date, { day: 'numeric', month: 'short' })}
                        </p>
                      )}
                    </div>

                    <span className="text-stone-300 text-sm">›</span>
                  </Link>
                )
              })}
            </div>
          )}
        </TabPanel>

        {/* Calendar tab */}
        <TabPanel value="calendar">
          <CalendarView gardenId={gardenId} />
        </TabPanel>
      </Tabs>
    </Layout>
  )
}
