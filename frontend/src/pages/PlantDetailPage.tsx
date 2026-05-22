import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2, Thermometer, Droplets, Calendar, Info } from 'lucide-react'
import { gardensApi } from '../api/gardens'
import { plantsApi } from '../api/plants'
import { tasksApi } from '../api/tasks'
import { photosApi } from '../api/photos'
import { Layout } from '../components/Layout'
import { Tabs, TabList, Tab, TabPanel } from '../components/ui/Tabs'
import { TaskItem } from '../components/TaskItem'
import { PhotoGallery } from '../components/PhotoGallery'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { PageLoader } from '../components/ui/Spinner'
import { STATUS_META, CATEGORY_META, cn, formatDate, cycleProgress } from '../lib/utils'

export default function PlantDetailPage() {
  const { id, gpId } = useParams<{ id: string; gpId: string }>()
  const gardenId = Number(id)
  const gpIdNum  = Number(gpId)
  const navigate  = useNavigate()
  const qc        = useQueryClient()
  const [tab, setTab]   = useState('tasks')

  const { data: gardenPlant, isLoading } = useQuery({
    queryKey: ['garden-plant', gpIdNum],
    queryFn: async () => {
      const plants = await gardensApi.plants.list(gardenId)
      return plants.find(p => p.id === gpIdNum)
    },
  })

  const { data: plant } = useQuery({
    queryKey: ['plant', gardenPlant?.plant_id],
    queryFn: () => plantsApi.get(gardenPlant!.plant_id),
    enabled: !!gardenPlant,
  })

  const { data: tasks } = useQuery({
    queryKey: ['plant-tasks', gpIdNum],
    queryFn: () => tasksApi.list({ pending_only: false }),
    select: (all) => all.filter(t => t.garden_plant_id === gpIdNum),
    enabled: tab === 'tasks',
  })

  const { data: photos } = useQuery({
    queryKey: ['photos', gpIdNum],
    queryFn: () => photosApi.list(gpIdNum),
    enabled: tab === 'photos',
  })

  const removeMutation = useMutation({
    mutationFn: () => gardensApi.plants.remove(gardenId, gpIdNum),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['garden-plants', gardenId] })
      navigate(`/gardens/${id}`)
    }
  })

  if (isLoading) return <Layout back={`/gardens/${id}`}><PageLoader /></Layout>
  if (!gardenPlant) return <Layout back={`/gardens/${id}`}><p className="text-center py-12 text-stone-500">Planta no encontrada</p></Layout>

  const statusMeta = STATUS_META[gardenPlant.status]
  const catMeta    = CATEGORY_META[gardenPlant.plant.category ?? '']
  const progress   = gardenPlant.sowing_date && plant?.days_to_harvest
    ? cycleProgress(gardenPlant.sowing_date, plant.days_to_harvest)
    : null

  const tasksByStatus = {
    pending:   tasks?.filter(t => !t.completed_at && !t.skipped) ?? [],
    completed: tasks?.filter(t => !!t.completed_at) ?? [],
    skipped:   tasks?.filter(t => t.skipped && !t.completed_at) ?? [],
  }

  return (
    <Layout
      title={gardenPlant.plant.name_es}
      back={`/gardens/${id}`}
      actions={
        <Button
          variant="ghost"
          size="sm"
          onClick={() => confirm('¿Retirar esta planta del huerto?') && removeMutation.mutate()}
          className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2"
        >
          <Trash2 size={15} />
        </Button>
      }
    >
      {/* Plant header */}
      <div className="flex items-start gap-4 mb-6 p-4 bg-white/80 rounded-2xl border border-linen shadow-card">
        <div className="w-16 h-16 rounded-xl bg-sage-100 flex items-center justify-center text-3xl overflow-hidden shrink-0">
          {gardenPlant.plant.image_url
            ? <img src={gardenPlant.plant.image_url} alt="" className="w-full h-full object-cover" />
            : '🌿'
          }
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-display text-xl font-bold text-forest">{gardenPlant.plant.name_es}</h2>
          <div className="flex flex-wrap gap-1.5 mt-1">
            <Badge className={statusMeta.color}>{statusMeta.label}</Badge>
            {catMeta && <Badge className={catMeta.color}>{catMeta.label}</Badge>}
            {gardenPlant.zone_label && (
              <Badge className="bg-stone-100 text-stone-600">{gardenPlant.zone_label}</Badge>
            )}
          </div>
          {gardenPlant.sowing_date && (
            <p className="text-xs text-sage-600 mt-1.5 flex items-center gap-1">
              <Calendar size={11} />
              Siembra: {formatDate(gardenPlant.sowing_date, { day: 'numeric', month: 'long' })}
            </p>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {progress !== null && gardenPlant.status === 'active' && (
        <div className="mb-5 p-4 bg-white/80 rounded-2xl border border-linen">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-sage-700">Progreso del ciclo</span>
            <span className="text-xs font-bold text-fern">{progress}%</span>
          </div>
          <div className="h-2 bg-parchment rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sage-400 to-fern rounded-full progress-bar"
              style={{ '--progress': `${progress}%` } as React.CSSProperties}
            />
          </div>
          {plant?.days_to_harvest && gardenPlant.sowing_date && (
            <p className="text-xs text-stone-400 mt-1.5">
              {plant.days_to_harvest} días hasta cosecha estimada
            </p>
          )}
        </div>
      )}

      {/* Tabs */}
      <Tabs value={tab} onChange={setTab}>
        <TabList className="mb-5">
          <Tab value="tasks">
            ✅ Tareas {tasksByStatus.pending.length > 0 && `(${tasksByStatus.pending.length})`}
          </Tab>
          <Tab value="photos">📸 Fotos</Tab>
          <Tab value="info">🌿 Info</Tab>
        </TabList>

        {/* Tasks tab */}
        <TabPanel value="tasks">
          <div className="flex flex-col gap-2">
            {tasksByStatus.pending.length === 0 && tasksByStatus.completed.length === 0 ? (
              <div className="text-center py-10 text-stone-400 text-sm">
                No hay tareas generadas todavía
              </div>
            ) : (
              <>
                {tasksByStatus.pending.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2 px-1">Pendientes</p>
                    <div className="flex flex-col gap-1.5">
                      {tasksByStatus.pending.map(t => (
                        <TaskItem key={t.id} task={t} queryKey={['plant-tasks', gpIdNum]} />
                      ))}
                    </div>
                  </div>
                )}
                {tasksByStatus.skipped.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2 px-1">Saltadas</p>
                    <div className="flex flex-col gap-1.5">
                      {tasksByStatus.skipped.map(t => (
                        <TaskItem key={t.id} task={t} queryKey={['plant-tasks', gpIdNum]} />
                      ))}
                    </div>
                  </div>
                )}
                {tasksByStatus.completed.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2 px-1">Completadas</p>
                    <div className="flex flex-col gap-1.5">
                      {tasksByStatus.completed.map(t => (
                        <TaskItem key={t.id} task={t} queryKey={['plant-tasks', gpIdNum]} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </TabPanel>

        {/* Photos tab */}
        <TabPanel value="photos">
          <PhotoGallery gpId={gpIdNum} photos={photos ?? []} />
        </TabPanel>

        {/* Info tab */}
        <TabPanel value="info">
          {!plant ? (
            <PageLoader />
          ) : (
            <div className="flex flex-col gap-4">
              {plant.description && (
                <div className="p-4 bg-white/80 rounded-2xl border border-linen">
                  <p className="text-sm text-stone-600 leading-relaxed">{plant.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {plant.temp_min_c != null && (
                  <div className="p-4 bg-white/80 rounded-xl border border-linen flex items-start gap-3">
                    <Thermometer size={18} className="text-clay shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-stone-400">Temperatura</p>
                      <p className="text-sm font-medium text-forest">
                        {plant.temp_min_c}°C — {plant.temp_max_c}°C
                      </p>
                      {plant.temp_optimal_c && (
                        <p className="text-xs text-sage-600">Óptima: {plant.temp_optimal_c}°C</p>
                      )}
                    </div>
                  </div>
                )}
                {plant.water_needs_mm_week != null && (
                  <div className="p-4 bg-white/80 rounded-xl border border-linen flex items-start gap-3">
                    <Droplets size={18} className="text-water-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-stone-400">Agua</p>
                      <p className="text-sm font-medium text-forest">{plant.water_needs_mm_week} mm/sem</p>
                    </div>
                  </div>
                )}
                {plant.days_to_harvest != null && (
                  <div className="p-4 bg-white/80 rounded-xl border border-linen flex items-start gap-3">
                    <Calendar size={18} className="text-harvest shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-stone-400">Ciclo</p>
                      <p className="text-sm font-medium text-forest">{plant.days_to_harvest} días</p>
                    </div>
                  </div>
                )}
                {plant.family && (
                  <div className="p-4 bg-white/80 rounded-xl border border-linen flex items-start gap-3">
                    <Info size={18} className="text-sage-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-stone-400">Familia</p>
                      <p className="text-sm font-medium text-forest italic">{plant.family}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Stages */}
              {plant.stages.length > 0 && (
                <div className="p-4 bg-white/80 rounded-2xl border border-linen">
                  <h3 className="font-medium text-forest text-sm mb-3">Etapas del ciclo</h3>
                  <div className="flex flex-col gap-2">
                    {plant.stages.map((stage, idx) => (
                      <div key={stage.id} className="flex items-start gap-3">
                        <div className={cn(
                          'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5',
                          'bg-sage-100 text-sage-700'
                        )}>
                          {idx + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-forest">{stage.stage_name}</p>
                          <p className="text-xs text-stone-400">
                            Día {stage.days_from_sowing}
                            {stage.repeat_every_days ? ` · cada ${stage.repeat_every_days}d` : ''}
                          </p>
                          {stage.description && (
                            <p className="text-xs text-stone-500 mt-0.5">{stage.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabPanel>
      </Tabs>
    </Layout>
  )
}
