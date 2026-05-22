import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { plantsApi } from '../api/plants'
import { gardensApi } from '../api/gardens'
import { Layout } from '../components/Layout'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Badge } from '../components/ui/Badge'
import { PageLoader } from '../components/ui/Spinner'
import { CATEGORY_META, cn } from '../lib/utils'
import type { PlantListItem, GardenPlantCreatePayload } from '../types'

export default function AddPlantPage() {
  const { id } = useParams<{ id: string }>()
  const gardenId = Number(id)
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [selected, setSelected] = useState<PlantListItem | null>(null)

  const [form, setForm] = useState<Pick<GardenPlantCreatePayload, 'zone_label' | 'sowing_date' | 'notes'>>({
    zone_label: '',
    sowing_date: new Date().toISOString().split('T')[0],
    notes: '',
  })
  const [error, setError] = useState('')

  const { data: plants, isLoading } = useQuery({
    queryKey: ['plants', search, category],
    queryFn: () => plantsApi.list(search || undefined, category || undefined),
  })

  const addMutation = useMutation({
    mutationFn: (payload: GardenPlantCreatePayload) => gardensApi.plants.add(gardenId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['garden-plants', gardenId] })
      navigate(`/gardens/${id}`)
    },
    onError: (err) => setError((err as Error).message),
  })

  const handleAdd = () => {
    if (!selected) return
    addMutation.mutate({
      plant_id: selected.id,
      zone_label: form.zone_label || undefined,
      sowing_date: form.sowing_date || undefined,
      notes: form.notes || undefined,
    })
  }

  const categories = ['verdura', 'fruta', 'hierba', 'legumbre']

  return (
    <Layout title="Añadir planta" back={`/gardens/${id}`}>
      <div className="flex flex-col gap-5">
        {/* Search */}
        <div className="flex flex-col gap-3">
          <Input
            placeholder="Buscar planta… (tomate, lechuga…)"
            value={search}
            onChange={e => setSearch(e.target.value)}
            icon={<Search size={15} />}
          />

          {/* Category filters */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setCategory('')}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium transition-all',
                !category ? 'bg-fern text-cream' : 'bg-parchment text-sage-600 hover:bg-linen'
              )}
            >
              Todas
            </button>
            {categories.map(cat => {
              const meta = CATEGORY_META[cat]
              return (
                <button
                  key={cat}
                  onClick={() => setCategory(cat === category ? '' : cat)}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-medium transition-all',
                    category === cat ? 'bg-fern text-cream' : 'bg-parchment text-sage-600 hover:bg-linen'
                  )}
                >
                  {meta?.label ?? cat}
                </button>
              )
            })}
          </div>
        </div>

        {/* Plants grid */}
        {isLoading ? (
          <PageLoader />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {plants?.map(plant => {
              const catMeta = CATEGORY_META[plant.category ?? '']
              return (
                <button
                  key={plant.id}
                  onClick={() => setSelected(plant)}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-150 text-left',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-400',
                    'bg-white/80 hover:border-sage-300 hover:shadow-card',
                    selected?.id === plant.id
                      ? 'border-fern bg-sage-50 shadow-green'
                      : 'border-linen'
                  )}
                >
                  <div className="w-14 h-14 rounded-xl bg-sage-100 flex items-center justify-center text-3xl overflow-hidden">
                    {plant.image_url
                      ? <img src={plant.image_url} alt="" className="w-full h-full object-cover rounded-xl" />
                      : '🌿'
                    }
                  </div>
                  <div className="text-center w-full">
                    <p className="font-medium text-forest text-sm leading-tight">{plant.name_es}</p>
                    {catMeta && (
                      <Badge className={cn('mt-1', catMeta.color)}>{catMeta.label}</Badge>
                    )}
                  </div>
                </button>
              )
            })}
            {plants?.length === 0 && (
              <div className="col-span-full text-center py-10 text-stone-400 text-sm">
                No se encontraron plantas con ese filtro
              </div>
            )}
          </div>
        )}
      </div>

      {/* Plant configuration modal */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={`Añadir ${selected?.name_es ?? 'planta'}`}
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Fecha de siembra"
            type="date"
            value={form.sowing_date ?? ''}
            onChange={e => setForm(f => ({ ...f, sowing_date: e.target.value }))}
          />
          <Input
            label="Zona o bancal (opcional)"
            placeholder="Ej: Bancal 1, Terraza sur…"
            value={form.zone_label ?? ''}
            onChange={e => setForm(f => ({ ...f, zone_label: e.target.value }))}
          />
          <Input
            label="Notas (opcional)"
            placeholder="Variedad, procedencia…"
            value={form.notes ?? ''}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          />

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>
          )}

          <div className="bg-sage-50 rounded-xl p-3 border border-sage-200">
            <p className="text-xs text-sage-700">
              🌱 Se generará automáticamente el calendario de tareas (siembra, riego, cosecha) ajustado al clima de tu huerto.
            </p>
          </div>

          <Button onClick={handleAdd} loading={addMutation.isPending} className="w-full">
            Añadir al huerto
          </Button>
        </div>
      </Modal>
    </Layout>
  )
}
