import { useState, useRef } from 'react'
import { Camera, Trash2, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { photosApi } from '../api/photos'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import type { Photo } from '../types'

interface PhotoGalleryProps {
  gpId: number
  photos: Photo[]
}

export function PhotoGallery({ gpId, photos }: PhotoGalleryProps) {
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [caption, setCaption] = useState('')
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [uploading, setUploading] = useState(false)

  const queryKey = ['photos', gpId]

  const remove = useMutation({
    mutationFn: (photoId: number) => photosApi.remove(gpId, photoId),
    onSuccess: () => qc.invalidateQueries({ queryKey })
  })

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      await photosApi.upload(gpId, file, caption || undefined)
      qc.invalidateQueries({ queryKey })
      setCaption('')
    } catch (err) {
      alert((err as Error).message)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const lbPhoto = lightbox !== null ? photos[lightbox] : null

  return (
    <div className="flex flex-col gap-4">
      {/* Upload area */}
      <div className="flex flex-col sm:flex-row gap-3 p-4 bg-parchment rounded-xl border border-linen">
        <Input
          placeholder="Descripción opcional…"
          value={caption}
          onChange={e => setCaption(e.target.value)}
          className="flex-1"
        />
        <Button
          variant="secondary"
          onClick={() => fileRef.current?.click()}
          loading={uploading}
          className="shrink-0"
        >
          <Camera size={15} />
          Añadir foto
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Grid */}
      {photos.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-stone-400">
          <Camera size={32} className="opacity-40" />
          <p className="text-sm">Sin fotos todavía</p>
          <p className="text-xs">Las fotos que tomes aparecerán aquí</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {photos.map((photo, idx) => (
            <div
              key={photo.id}
              className="group relative aspect-square rounded-xl overflow-hidden bg-parchment cursor-pointer"
              onClick={() => setLightbox(idx)}
            >
              <img
                src={photo.url}
                alt={photo.caption ?? 'Foto del huerto'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {photo.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-forest/60 px-2 py-1">
                  <p className="text-xs text-cream truncate">{photo.caption}</p>
                </div>
              )}
              <button
                onClick={e => { e.stopPropagation(); remove.mutate(photo.id) }}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-red-500/90 text-white p-1.5 rounded-lg transition-opacity"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lbPhoto && (
        <div className="fixed inset-0 z-50 bg-forest/95 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 text-cream/70 hover:text-cream p-2">
            <X size={24} />
          </button>
          {lightbox! > 0 && (
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 text-cream/70 hover:text-cream p-2"
              onClick={e => { e.stopPropagation(); setLightbox(lightbox! - 1) }}
            >
              <ChevronLeft size={28} />
            </button>
          )}
          {lightbox! < photos.length - 1 && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 text-cream/70 hover:text-cream p-2"
              onClick={e => { e.stopPropagation(); setLightbox(lightbox! + 1) }}
            >
              <ChevronRight size={28} />
            </button>
          )}
          <div className="max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <img
              src={lbPhoto.url}
              alt={lbPhoto.caption ?? ''}
              className="w-full max-h-[80dvh] object-contain rounded-xl"
            />
            {lbPhoto.caption && (
              <p className="text-center text-cream/80 text-sm mt-3">{lbPhoto.caption}</p>
            )}
            <p className="text-center text-cream/40 text-xs mt-1">
              {new Date(lbPhoto.taken_at).toLocaleDateString('es-ES', { day:'numeric', month:'long', year:'numeric' })}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
