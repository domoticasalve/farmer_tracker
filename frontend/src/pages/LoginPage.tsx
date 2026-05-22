import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, User, Sprout, ArrowRight } from 'lucide-react'
import { login, register } from '../api/auth'
import { useAuthStore } from '../stores/authStore'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

type Mode = 'login' | 'register'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setToken } = useAuthStore()
  const [mode, setMode] = useState<Mode>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        const tok = await login(form.email, form.password)
        setToken(tok.access_token)
      } else {
        await register(form.name, form.email, form.password)
        const tok = await login(form.email, form.password)
        setToken(tok.access_token)
      }
      navigate('/dashboard')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex">
      {/* Left panel — botanical hero */}
      <div className="hidden lg:flex lg:w-5/12 botanical-bg flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Decorative leaf shapes */}
        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-sage-600/20" />
        <div className="absolute -bottom-16 -right-16 w-80 h-80 rounded-full bg-forest/40" />
        <div className="absolute top-1/3 right-8 w-40 h-40 rounded-full bg-sage-400/10" />

        <div className="relative z-10 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-cream/10 mb-6 border border-cream/20">
            <Sprout size={36} className="text-cream" />
          </div>
          <h1 className="font-display text-4xl font-bold text-cream leading-tight mb-3">
            Farmer<br />Tracker
          </h1>
          <p className="text-sage-200 text-base leading-relaxed max-w-xs mx-auto">
            Cultiva con inteligencia. Tu huerto, tus ritmos, el tiempo a tu favor.
          </p>

          <div className="mt-10 flex flex-col gap-4 text-left">
            {[
              { icon: '🌱', text: 'Calendarios de siembra automáticos' },
              { icon: '💧', text: 'Riego ajustado a la lluvia prevista' },
              { icon: '🌾', text: 'Registro visual de cada cosecha' },
            ].map(item => (
              <div key={item.text} className="flex items-center gap-3">
                <span className="text-xl">{item.icon}</span>
                <span className="text-sage-100 text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-fern flex items-center justify-center">
            <Sprout size={20} className="text-cream" />
          </div>
          <span className="font-display text-2xl font-bold text-fern">Farmer Tracker</span>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="font-display text-2xl font-bold text-forest">
              {mode === 'login' ? 'Bienvenido' : 'Crear cuenta'}
            </h2>
            <p className="text-stone-500 text-sm mt-1">
              {mode === 'login'
                ? 'Accede a tus huertos'
                : 'Empieza a gestionar tu huerto'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === 'register' && (
              <Input
                label="Nombre"
                type="text"
                placeholder="Tu nombre"
                value={form.name}
                onChange={set('name')}
                icon={<User size={16} />}
                required
              />
            )}
            <Input
              label="Email"
              type="email"
              placeholder="tu@email.com"
              value={form.email}
              onChange={set('email')}
              icon={<Mail size={16} />}
              required
            />
            <Input
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={set('password')}
              icon={<Lock size={16} />}
              required
            />

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button type="submit" size="lg" loading={loading} className="mt-2 w-full justify-between">
              {mode === 'login' ? 'Entrar' : 'Crear cuenta'}
              <ArrowRight size={18} />
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError('') }}
              className="text-sm text-sage-600 hover:text-fern transition-colors"
            >
              {mode === 'login'
                ? '¿Sin cuenta? Regístrate'
                : '¿Ya tienes cuenta? Inicia sesión'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
