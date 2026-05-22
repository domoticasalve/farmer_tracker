import { MapPin, Sprout } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Garden } from '../types'
import { cn } from '../lib/utils'

interface GardenCardProps {
  garden: Garden
  plantCount?: number
  pendingTaskCount?: number
}

const GRADIENT_FALLBACKS = [
  'from-sage-700 to-forest',
  'from-earth to-fern',
  'from-water-600 to-forest',
  'from-sage-600 to-earth',
]

export function GardenCard({ garden, plantCount = 0, pendingTaskCount = 0 }: GardenCardProps) {
  const gradientIdx = garden.id % GRADIENT_FALLBACKS.length
  const grad = GRADIENT_FALLBACKS[gradientIdx]

  return (
    <Link
      to={`/gardens/${garden.id}`}
      className="group block rounded-2xl overflow-hidden shadow-card card-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-400"
    >
      {/* Cover image */}
      <div className={cn('relative h-44 bg-gradient-to-br', grad)}>
        {garden.photo_url ? (
          <img
            src={garden.photo_url}
            alt={garden.name}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <svg viewBox="0 0 120 120" className="w-24 h-24 fill-cream">
              <path d="M60 10 C60 10 25 40 25 72 C25 91 40.7 107 60 107 C79.3 107 95 91 95 72 C95 40 60 10 60 10Z"/>
              <line x1="60" y1="10" x2="60" y2="107" stroke="currentColor" strokeWidth="3"/>
              <path d="M60 55 C60 55 38 44 34 28" stroke="currentColor" strokeWidth="2" fill="none"/>
              <path d="M60 72 C60 72 80 61 84 45" stroke="currentColor" strokeWidth="2" fill="none"/>
            </svg>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-forest/80 via-transparent to-transparent" />

        {/* Pending tasks badge */}
        {pendingTaskCount > 0 && (
          <div className="absolute top-3 right-3 bg-harvest text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm">
            {pendingTaskCount} tarea{pendingTaskCount !== 1 ? 's' : ''}
          </div>
        )}

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="font-display text-lg font-semibold text-cream leading-tight">{garden.name}</h3>
          {garden.location_label && (
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin size={11} className="text-cream/70" />
              <span className="text-xs text-cream/70 truncate">{garden.location_label}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white/90 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sage-600">
          <Sprout size={14} />
          <span className="text-sm font-medium">{plantCount} planta{plantCount !== 1 ? 's' : ''}</span>
        </div>
        <span className="text-xs text-stone-400">Ver huerto →</span>
      </div>
    </Link>
  )
}

export function NewGardenCard() {
  return (
    <Link
      to="/gardens/new"
      className="block rounded-2xl border-2 border-dashed border-sage-200 hover:border-sage-400 transition-colors h-full min-h-[200px] flex flex-col items-center justify-center gap-3 text-sage-400 hover:text-sage-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-400"
    >
      <div className="w-12 h-12 rounded-full border-2 border-current flex items-center justify-center">
        <span className="text-2xl leading-none">+</span>
      </div>
      <span className="text-sm font-medium">Nuevo huerto</span>
    </Link>
  )
}
