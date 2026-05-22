import { api } from './client'
import type { Plant, PlantListItem } from '../types'

export const plantsApi = {
  list: (q?: string, category?: string) => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (category) params.set('category', category)
    const qs = params.toString()
    return api.get<PlantListItem[]>(`/plants${qs ? '?' + qs : ''}`)
  },
  get: (id: number) => api.get<Plant>(`/plants/${id}`),
}
