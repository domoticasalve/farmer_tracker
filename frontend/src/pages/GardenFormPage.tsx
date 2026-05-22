import { useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MapPin, Camera, Trash2 } from 'lucide-react'
import { gardensApi } from '../api/gardens'
import { Layout } from '../components/Layout'
import { Button } from '../components/ui/Button'
import { Input, Textarea } from '../components/ui/Input'
import type { GardenCreatePayload } from '../types'

export default function GardenFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const { data: existing } = useQuery({
    queryKey: ['garden', id],
    queryFn: () => gardensApi.get(Number(id)),
    enabled: isEdit,
  })

  const [form, setForm] = useState<GardenCreatePayload>({
    name: existing?.name ?? '',
    description: existing?.description ?? '',
    location_label: existing?.location_label ?? '',
    lat: existing?.lat,
    lon: existing?.lon,
  })

  const set = (k: keyof GardenCreatePayload) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))

  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string>(existing?.photo_url ?? '')
  const [error, setError] = useState('')

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: GardenCreatePayload = {
        name: form.name,
        description: form.description || undefined,
        location_label: form.location_label || undefined,
        lat: form.lat ? Number(form.lat) : undefined,
        lon: form.lon ? Number(form.lon) : undefined,
      }
      const garden = isEdit
        ? await gardensApi.update(Number(id), payload)
        : await gardensApi.create(payload)

      if (photoFile) {
        await gardensApi.uploadPhoto(garden.id, photoFile)
      }
      return garden
    },
    onSuccess: (garden) => {
      qc.invalidateQueries({ queryKey: ['gardens'] })
      qc.invalidateQueries({ queryKey: ['garden', String(garden.id)] })
      navigate(`/gardens/${garden.id}`)
    },
    onError: (err) => setError((err as Error).message),
  })

  const deleteMutation = useMutation({
    mutationFn: () => gardensApi.remove(Number(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gardens'] })
      navigate('/dashboard')
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('El nombre es obligatorio'); return }
    saveMutation.mutate()
  }

  return (
    <Layout
      title={isEdit ? 'Editar huerto' : 'Nuevo huerto'}
      back={isEdit ? `/gardens/${id}` : '/dashboard'}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Photo upload */}
        <div
          className="relative h-48 rounded-2xl overflow-hidden bg-gradient-to-br from-sage-700 to-forest cursor-pointer group"
          onClick={() => fileRef.current?.click()}
        >
          {photoPreview ? (
            <img src={photoPreview} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-cream/60 group-hover:text-cream transition-colors">
              <Camera size={32} />
              <span className="text-sm">Añadir foto de portada</span>
            </div>
          )}
          <div className="absolute inset-0 bg-forest/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="bg-forest/60 text-cream px-3 py-1.5 rounded-lg text-sm flex items-center gap-2">
              <Camera size={14} /> Cambiar foto
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
        </div>

        {/* Fields */}
        <div className="flex flex-col gap-4 bg-white/60 rounded-2xl p-5 border border-linen">
          <Input
            label="Nombre del huerto *"
            placeholder="Ej: Huerto de la terraza"
            value={form.name}
            onChange={set('name')}
            required
          />
          <Textarea
            label="Descripción"
            placeholder="Notas sobre este huerto…"
            rows={3}
            value={form.description ?? ''}
            onChange={set('description')}
          />
        </div>

        {/* Location */}
        <div className="flex flex-col gap-4 bg-white/60 rounded-2xl p-5 border border-linen">
          <div className="flex items-center gap-2 mb-1">
            <MapPin size={16} className="text-sage-500" />
            <h3 className="font-medium text-forest text-sm">Ubicación (para alertas climáticas)</h3>
          </div>
          <Input
            label="Dirección o nombre del lugar"
            placeholder="Ej: Sevilla, España"
            value={form.location_label ?? ''}
            onChange={set('location_label')}
            icon={<MapPin size={14} />}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Latitud"
              type="number"
              step="0.000001"
              placeholder="37.3891"
              value={form.lat ?? ''}
              onChange={set('lat')}
            />
            <Input
              label="Longitud"
              type="number"
              step="0.000001"
              placeholder="-5.9845"
              value={form.lon ?? ''}
              onChange={set('lon')}
            />
          </div>
          <p className="text-xs text-stone-400">
            💡 Puedes buscar las coordenadas en Google Maps: clic derecho → "¿Qué hay aquí?"
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        <div className="flex flex-col gap-3">
          <Button type="submit" size="lg" loading={saveMutation.isPending}>
            {isEdit ? 'Guardar cambios' : 'Crear huerto'}
          </Button>
          {isEdit && (
            <Button
              type="button"
              variant="danger"
              onClick={() => {
                if (confirm('¿Eliminar este huerto y todas sus plantas?')) deleteMutation.mutate()
              }}
              loading={deleteMutation.isPending}
            >
              <Trash2 size={15} /> Eliminar huerto
            </Button>
          )}
        </div>
      </form>
    </Layout>
  )
}
