import { api } from './client'
import type { Task } from '../types'

export interface TaskFilters {
  garden_id?: number
  from_date?: string
  to_date?: string
  pending_only?: boolean
}

export const tasksApi = {
  list: (filters: TaskFilters = {}) => {
    const params = new URLSearchParams()
    if (filters.garden_id)   params.set('garden_id', String(filters.garden_id))
    if (filters.from_date)   params.set('from_date', filters.from_date)
    if (filters.to_date)     params.set('to_date', filters.to_date)
    if (filters.pending_only) params.set('pending_only', 'true')
    const qs = params.toString()
    return api.get<Task[]>(`/tasks${qs ? '?' + qs : ''}`)
  },
  complete: (id: number, notes?: string) => api.post<Task>(`/tasks/${id}/complete`, { notes }),
  skip:     (id: number, notes?: string) => api.post<Task>(`/tasks/${id}/skip`,     { notes }),
}
