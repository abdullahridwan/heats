export type HeatStatus = 'draft' | 'open' | 'results' | 'closed'
export type StampShape = 'circle' | 'octagon' | 'rect' | 'oval'

export type Heat = {
  id: string
  number: number
  name: string
  park: string
  borough: string
  starts_at: string
  meet_point: string
  address: string | null
  note: string | null
  distance_km: number
  color_key: string
  stamp_shape: StampShape
  course_key: string | null
  cover_url: string | null
  status: HeatStatus
}

export type Profile = {
  id: string
  alias: string
  avatar_url: string | null
  home_park: string | null
  created_at: string
}

export type SheetRow = {
  heat_id: string
  place: number
  result_id: string
  user_id: string
  alias: string
  avatar_url: string | null
  time_seconds: number
  note: string | null
}

export type Result = {
  id: string
  heat_id: string
  user_id: string
  time_seconds: number
  note: string | null
  screenshot_path: string
  status: 'pending' | 'verified' | 'rejected'
  reject_reason: string | null
  created_at: string
}

export type Finish = {
  heat: Heat
  time_seconds: number
  note: string | null
  place: number
  finishers: number
  last: boolean
}
