export interface User {
  id: number
  email: string
  name: string
  created_at: string
}

export interface Garden {
  id: number
  name: string
  description?: string
  lat?: number
  lon?: number
  timezone?: string
  location_label?: string
  photo_url?: string
  created_at: string
  plant_count: number
}

export interface PlantListItem {
  id: number
  name_es: string
  name_en?: string
  category?: string
  image_url?: string
}

export interface PlantStage {
  id: number
  stage_name: string
  action_type: ActionType
  days_from_sowing: number
  repeat_every_days?: number
  description?: string
}

export interface Plant extends PlantListItem {
  family?: string
  days_to_harvest?: number
  water_needs_mm_week?: number
  temp_min_c?: number
  temp_max_c?: number
  temp_optimal_c?: number
  description?: string
  stages: PlantStage[]
}

export interface GardenPlant {
  id: number
  garden_id: number
  plant_id: number
  plant: PlantListItem
  zone_label?: string
  sowing_date?: string
  status: 'active' | 'harvested' | 'removed'
  notes?: string
  created_at: string
}

export type ActionType = 'SOWING' | 'TRANSPLANT' | 'WATER' | 'FERTILIZE' | 'HARVEST' | 'CHECK'

export interface Task {
  id: number
  garden_plant_id: number
  garden_id: number
  garden_name: string
  action_type: ActionType
  title: string
  scheduled_date: string
  completed_at?: string
  skipped: boolean
  auto_skipped_by_rain: boolean
  notes?: string
}

export interface Photo {
  id: number
  garden_plant_id: number
  task_id?: number
  url: string
  caption?: string
  taken_at: string
}

export interface Token {
  access_token: string
  token_type: string
}

export interface GardenCreatePayload {
  name: string
  description?: string
  lat?: number
  lon?: number
  location_label?: string
}

export interface GardenPlantCreatePayload {
  plant_id: number
  zone_label?: string
  sowing_date?: string
  notes?: string
}
