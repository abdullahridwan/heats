import { RegExpMatcher, englishDataset, englishRecommendedTransformers } from 'obscenity'

export const HANDLE_RE = /^[a-z0-9._]{3,20}$/

const RESERVED = new Set([
  'admin', 'administrator', 'heats', 'heat', 'support', 'help', 'root', 'staff', 'mod', 'moderator',
  'official', 'team', 'null', 'undefined', 'api', 'www', 'p', 'calendar', 'join', 'post', 'signin',
  'signout', 'results', 'about', 'stamp', 'stamps',
])

const profanity = new RegExpMatcher({ ...englishDataset.build(), ...englishRecommendedTransformers })

// Trim, lowercase, drop a leading @.
export function normalizeHandle(raw: string): string {
  return raw.trim().toLowerCase().replace(/^@/, '')
}

export function validateHandle(h: string): { ok: true } | { ok: false; reason: 'format' | 'reserved' | 'blocked' } {
  if (!HANDLE_RE.test(h)) return { ok: false, reason: 'format' }
  if (RESERVED.has(h)) return { ok: false, reason: 'reserved' }
  // Check both the raw handle and a version with separators read as word breaks (e.g. "a.ss" -> "a ss").
  if (profanity.hasMatch(h) || profanity.hasMatch(h.replace(/[._]/g, ' '))) return { ok: false, reason: 'blocked' }
  return { ok: true }
}
