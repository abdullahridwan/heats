export type Heat = {
  id: string
  number: number
  name: string
  opens_at: string
  closes_at: string
  location_terms: string[]
  min_km: number
  max_km: number
}

export type UserRow = {
  id: string
  alias: string
  email: string
  avatar_url: string | null
  created_at: string
}

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

export type ResultRow = {
  heat_id: string
  alias: string
  avatar_url: string | null
  time_s: number
  note: string | null
  place: number
}

// A stamped heat on a passport: the result row joined to its heat.
export type Stamp = {
  heat: Heat
  alias: string
  time_s: number
  note: string | null
  place: number
  finishers: number
}
