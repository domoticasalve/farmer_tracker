import { cn } from '../../lib/utils'
import { createContext, useContext, type ReactNode } from 'react'

interface TabsCtx { active: string; setActive: (v: string) => void }
const Ctx = createContext<TabsCtx>({ active: '', setActive: () => {} })

export function Tabs({ value, onChange, children, className }: {
  value: string; onChange: (v: string) => void; children: ReactNode; className?: string
}) {
  return (
    <Ctx.Provider value={{ active: value, setActive: onChange }}>
      <div className={className}>{children}</div>
    </Ctx.Provider>
  )
}

export function TabList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex gap-1 bg-parchment rounded-xl p-1', className)}>
      {children}
    </div>
  )
}

export function Tab({ value, children }: { value: string; children: ReactNode }) {
  const { active, setActive } = useContext(Ctx)
  const isActive = active === value
  return (
    <button
      onClick={() => setActive(value)}
      className={cn(
        'flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
        isActive
          ? 'bg-fern text-cream shadow-sm'
          : 'text-sage-600 hover:text-forest hover:bg-linen'
      )}
    >
      {children}
    </button>
  )
}

export function TabPanel({ value, children, className }: { value: string; children: ReactNode; className?: string }) {
  const { active } = useContext(Ctx)
  if (active !== value) return null
  return <div className={cn('page-enter', className)}>{children}</div>
}
