import { cn } from '../../lib/utils'
import { X } from 'lucide-react'
import { type ReactNode, useEffect } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  className?: string
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-forest/40 backdrop-blur-sm" />
      <div
        className={cn(
          'relative w-full max-w-lg bg-cream rounded-2xl shadow-2xl animate-fade-up',
          'max-h-[90dvh] overflow-y-auto',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-linen px-5 py-4">
            <h2 className="font-display text-lg font-semibold text-forest">{title}</h2>
            <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-parchment transition-colors">
              <X size={18} className="text-sage-600" />
            </button>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
