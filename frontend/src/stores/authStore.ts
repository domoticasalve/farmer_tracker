import { create } from 'zustand'
import type { User } from '../types'

interface AuthState {
  token: string | null
  user: User | null
  setToken: (token: string) => void
  setUser:  (user: User)    => void
  logout:   ()              => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('farmer_token'),
  user:  null,

  setToken: (token) => {
    localStorage.setItem('farmer_token', token)
    set({ token })
  },

  setUser: (user) => set({ user }),

  logout: () => {
    localStorage.removeItem('farmer_token')
    set({ token: null, user: null })
  },
}))
