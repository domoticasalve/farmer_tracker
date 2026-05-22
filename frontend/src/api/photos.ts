import { api } from './client'
import type { Photo } from '../types'

export const photosApi = {
  list: (gpId: number) => api.get<Photo[]>(`/garden-plants/${gpId}/photos`),

  upload: (gpId: number, file: File, caption?: string, taskId?: number) => {
    const form = new FormData()
    form.append('file', file)
    if (caption) form.append('caption', caption)
    if (taskId)  form.append('task_id', String(taskId))
    return api.upload<Photo>(`/garden-plants/${gpId}/photos`, form)
  },

  remove: (gpId: number, photoId: number) =>
    api.delete<void>(`/garden-plants/${gpId}/photos/${photoId}`),
}
