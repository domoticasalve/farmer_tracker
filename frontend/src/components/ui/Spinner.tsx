import { cn } from '../../lib/utils'

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn('animate-spin text-sage-500', className ?? 'h-6 w-6')} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

export function PageLoader() {
  return (
    <div className="flex h-full min-h-[40vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Spinner className="h-10 w-10 text-fern" />
        <p className="text-sm text-sage-600 animate-pulse">Cargando…</p>
      </div>
    </div>
  )
}
