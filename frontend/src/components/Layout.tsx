import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Home, LogOut, Sprout } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import type { ReactNode } from 'react'

interface LayoutProps {
  children: ReactNode
  title?: string
  back?: string
  actions?: ReactNode
}

export function Layout({ children, title, back, actions }: LayoutProps) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-dvh flex flex-col bg-cream">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-cream/90 backdrop-blur-sm border-b border-linen pt-safe">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            {back ? (
              <Link to={back} className="p-1.5 -ml-1.5 rounded-lg hover:bg-parchment transition-colors text-sage-600">
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            ) : (
              <Link to="/dashboard" className="flex items-center gap-1.5 text-fern">
                <Sprout size={22} className="shrink-0" />
                <span className="font-display text-base font-semibold hidden sm:block">Farmer Tracker</span>
              </Link>
            )}
            {title && (
              <h1 className="font-display font-semibold text-forest truncate text-base">
                {back ? title : ''}
              </h1>
            )}
          </div>

          <div className="flex items-center gap-2">
            {actions}
            {!back && location.pathname !== '/dashboard' && (
              <Link to="/dashboard" className="p-2 rounded-xl hover:bg-parchment transition-colors text-sage-600" title="Inicio">
                <Home size={18} />
              </Link>
            )}
            {user && (
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl hover:bg-parchment transition-colors text-sage-400 hover:text-red-500"
                title="Cerrar sesión"
              >
                <LogOut size={18} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 pb-safe page-enter">
        {children}
      </main>
    </div>
  )
}
