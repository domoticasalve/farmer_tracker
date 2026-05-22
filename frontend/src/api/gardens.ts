import { api } from './client'
import type { Garden, GardenCreatePayload, GardenPlant, GardenPlantCreatePayload } from '../types'

export const gardensApi = {
  list:   ()                                    => api.get<Garden[]>('/gardens'),
  get:    (id: number)                          => api.get<Garden>(`/gardens/${id}`),
  create: (data: GardenCreatePayload)           => api.post<Garden>('/gardens', data),
  update: (id: number, data: Partial<GardenCreatePayload>) => api.patch<Garden>(`/gardens/${id}`, data),
  remove: (id: number)                          => api.delete<void>(`/gardens/${id}`),

  uploadPhoto: (id: number, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.upload<Garden>(`/gardens/${id}/photo`, form)
  },

  plants: {
    list:   (gardenId: number)                            => api.get<GardenPlant[]>(`/gardens/${gardenId}/plants`),
    add:    (gardenId: number, data: GardenPlantCreatePayload) => api.post<GardenPlant>(`/gardens/${gardenId}/plants`, data),
    update: (gardenId: number, gpId: number, data: Partial<GardenPlantCreatePayload>) =>
      api.patch<GardenPlant>(`/gardens/${gardenId}/plants/${gpId}`, data),
    remove: (gardenId: number, gpId: number) => api.delete<void>(`/gardens/${gardenId}/plants/${gpId}`),
  }
}
