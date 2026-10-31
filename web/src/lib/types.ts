export type Heat = {
  id: string
  number: number
  name: string
  park: string
  scene: string
  opens_at: string
  closes_at: string
  location_terms: string[]
  min_km: number
  max_km: number
}

export type HeatState = 'live' | 'upcoming' | 'past'

export type Runner = {
  id: string
  alias: string
  email: string
  created_at: string
}

export type ResultRow = {
  heat_id: string
  alias: string
  time_s: number
  note: string | null
  place: number
}

// A stamped heat on a stamp case: the heat plus this runner's time and place in it.
export type StampEntry = {
  heat: Heat
  time_s: number
  place: number
}

// Kept so older imports still resolve. Prefer StampEntry.
export type Stamp = StampEntry

export type SubmissionStatus = 'auto_verified' | 'needs_review' | 'verified' | 'rejected'

export type Submission = {
  id: string
  user_id: string
  heat_id: string
  image_path: string
  sha256: string
  dhash: string
  distance_km: number | null
  time_s: number | null
  pace_s_per_km: number | null
  note: string | null
  status: SubmissionStatus
  review_reason: string | null
  attempts: number
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
}
