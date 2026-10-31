# Heats rebuild plan: stamps, weekly heats, no Clerk, no Luma

Source of truth for the design: `design/mockups/*.dc.html` (open as HTML; the markup between `<x-dc>` tags is the page).
Stamp art reference implementation: `design/heat-stamp.py`.

## What we are building

Two tabs: **Calendar** and **Stamp case**. Every action starts from a heat on the calendar.

- A heat runs a whole weekend (Sat 00:00 to Sun 23:59, New York time) in one park. Each heat has its own postal stamp.
- **Join a heat** (future heat): first time = claim an @handle + email, then a 6-digit email code (Supabase Auth OTP). After that the phone stays signed in and Join is one tap.
- **Submit your run** (live heat): upload Strava screenshot, the existing pipeline verifies it, the runner gets that heat's stamp (postmarked).
- **Results** (past heat): ranked heat sheet; each @ links to that runner's stamp case.
- **Stamp case**: `/p/[alias]`, public. Earned stamps (postmarked, slightly tilted) plus dashed empty slots for the other heats of the season.
- Admin: `/admin`, protected by `ADMIN_PASSWORD`. Review queue (existing) plus a heats editor.

Removed: Clerk, Luma, medals, onboarding page, about page, old results page.

## Database (migration `web/supabase/migrations/0003_weekly_heats.sql`, NOT yet applied, waiting on Abdullah)

- `heats` gains `park text` and `scene text` (stamp scene key).
- New `signups (user_id text → users, heat_id uuid → heats, created_at, primary key (user_id, heat_id))`.
- `users.id` holds the Supabase Auth user id (text). `users.alias` is the @handle (citext, `^[a-z0-9._]{3,20}$`). `users.email` citext.
- `results` view unchanged: `heat_id, alias, avatar_url, time_s, note, place` (ignore avatar_url).
- Seeded heats 2..10, weekends Oct 31 to Dec 27 2026.

## Design tokens (owned by Part D, used by everyone)

CSS custom properties on `:root`:

| Token | Value | Use |
|---|---|---|
| `--navy` | `#061236` | text, primary buttons, dark moments |
| `--text2` | `#4c5265` | secondary text |
| `--text3` | `#6b7180` | labels |
| `--line` | `#f3f3f3` | dividers |
| `--line2` | `#e8e8e8` | borders, inputs |
| `--bg2` | `#FBFBFB` | panels |
| `--volt` | `#CCFF00` | live heat card, focus ring, "earned" only |
| `--volt-soft` | `#F2FFC4` | focus glow, "You're in" badge bg |
| `--volt-ink` | `#4B7A00` | text on volt-soft |
| `--danger` | `#D93B3B` | errors |
| `--f-serif` | Instrument Serif | headlines (weight 400, letter-spacing -0.02em) |
| `--f-sans` | DM Sans | body |
| `--f-mono` | DM Mono | times, small labels |

Rules: white background everywhere; navy primary buttons (radius 5px, min-height 48px); volt only for the live heat card, focus rings and earned states; color moments: "You're in" screen (full volt), "Stamped" screen (navy radial gradient). Inputs: 2px border `--line2`, focused = 2px `--volt` + `0 0 0 4px var(--volt-soft)`.

Page CSS: each page uses a co-located CSS Module (`page.module.css`) built on these tokens. `globals.css` only has tokens, reset, base type and the shared site chrome.

## Code contracts (exact signatures; code against these even before the other part lands)

### `src/lib/types.ts` (Part C)
```ts
export type Heat = { id: string; number: number; name: string; park: string; scene: string
  opens_at: string; closes_at: string; location_terms: string[]; min_km: number; max_km: number }
export type HeatState = 'live' | 'upcoming' | 'past'
export type Runner = { id: string; alias: string; email: string; created_at: string }
export type ResultRow = { heat_id: string; alias: string; time_s: number; note: string | null; place: number }
export type StampEntry = { heat: Heat; time_s: number; place: number }
export type SubmissionStatus = 'auto_verified' | 'needs_review' | 'verified' | 'rejected'
export type Submission = { /* unchanged from today */ }
```

### `src/lib/data.ts` (Part C, server-only, uses `db()` from `src/lib/db.ts`)
```ts
export const HEAT_COLS: string   // includes park, scene
export function heatState(h: Heat, now?: number): HeatState
export const getHeats: () => Promise<Heat[]>                 // ordered by number
export const getHeat: (n: number) => Promise<Heat | null>
export async function getCalendar(): Promise<{ live: Heat | null; upcoming: Heat[]; past: Heat[] }>  // past newest first
export async function getLiveHeat(): Promise<Heat | null>
export const getRunnerById: (id: string) => Promise<Runner | null>
export const getRunnerByAlias: (alias: string) => Promise<Runner | null>
export async function getSignedUpHeatIds(userId: string): Promise<string[]>
export async function getResults(heatId: string): Promise<ResultRow[]>   // ordered by place
export async function getStampCase(runnerId: string): Promise<{ stamps: StampEntry[]; heats: Heat[] }>  // heats = whole season
export const getMySubmission: (userId: string, heatId: string) => Promise<Submission | null>
export async function serverNow(): Promise<number>
```

### `src/lib/session.ts` (Part B, server-only)
```ts
export async function getAuthUser(): Promise<{ id: string; email: string } | null>  // Supabase Auth user from cookies
export async function getRunner(): Promise<Runner | null>                           // users row for the auth user
```

### `src/lib/handles.ts` (Part B, isomorphic, no server-only import)
```ts
export const HANDLE_RE = /^[a-z0-9._]{3,20}$/
export function normalizeHandle(raw: string): string     // trim, lowercase, strip leading @
export function validateHandle(h: string): { ok: true } | { ok: false; reason: 'format' | 'reserved' | 'blocked' }
```

### `src/lib/admin.ts` (Part B, server-only)
```ts
export async function isAdmin(): Promise<boolean>   // signed cookie set by POST /api/admin/login
```

### `src/lib/stamps.ts` (Part A, isomorphic)
```ts
export type SceneKey = 'central_fall'|'central_dusk'|'prospect'|'hudson'|'flushing'|'bbp'|'astoria'|'central_snow'|'coney'|'nye'
export const SCENES: Record<SceneKey, { park: string; name: string }>
export function stampSVG(o: { scene: string; heatNo: string; uid: string; postmark?: string | null }): string  // full <svg> string, width 100%
export function emptySlotSVG(heatNo: string): string
```
### `src/components/stamp.tsx` (Part A)
```tsx
export function Stamp(p: { scene: string; heatNo: string; postmark?: string | null; width?: number; tilt?: number; className?: string }): JSX.Element
export function EmptySlot(p: { heatNo: string; width?: number }): JSX.Element
```
`heatNo` is the zero-padded string (`heatNo()` from `src/lib/time.ts`). `postmark` is the date text, e.g. `"NOV 08"` (use `mon()` + `day()` from `src/lib/time.ts`); null/undefined = unused stamp.

### HTTP API (Part B owns all of these unless noted)
| Route | Body | Responses |
|---|---|---|
| `POST /api/auth/start` | `{ email, handle? }` | 200 `{ ok: true, newRunner: boolean }`; 400 `{ error: 'bad_email' \| 'handle_required' \| 'handle_format' \| 'handle_reserved' \| 'handle_blocked' }`; 409 `{ error: 'handle_taken' }`; 429 `{ error: 'rate_limited' }` |
| `POST /api/auth/verify` | `{ email, code, handle?, heat? }` | 200 `{ alias }`; 400 `{ error: 'bad_code' \| 'handle_required' }`; 409 `{ error: 'handle_taken' }` |
| `POST /api/auth/signout` | none | 200 `{ ok: true }` |
| `GET /api/handles/check?h=` | | 200 `{ available: boolean, reason?: 'format' \| 'reserved' \| 'blocked' \| 'taken' }` |
| `POST /api/signups` | `{ heat: number }` | 200 `{ ok: true }`; 401; 404; 409 `{ error: 'closed' }` (heat is past) |
| `POST /api/admin/login` | `{ password }` | 200 / 401 |
| `POST /api/admin/logout` | | 200 |
| `POST /api/admin/heats` (Part G) | heat fields | 200 / 400 / 401 |
| existing `/api/submissions*`, `/api/admin/submissions*` | unchanged bodies | switch auth to `getRunner()` / `isAdmin()` |

`/api/submissions` POST: if `heat` is omitted, use the live heat.

## Parts and file ownership (no two parts touch the same file)

| Part | Owns |
|---|---|
| A Stamps | `src/lib/stamps.ts`, `src/components/stamp.tsx` |
| B Auth + API | `src/lib/supabase-server.ts`, `src/lib/session.ts`, `src/lib/handles.ts`, `src/lib/admin.ts`, `src/proxy.ts`, `src/app/api/auth/**`, `src/app/api/handles/**`, `src/app/api/signups/**`, `src/app/api/admin/login/**`, `src/app/api/admin/logout/**`, `src/app/api/submissions/**`, `src/app/api/admin/submissions/**`; deletes `src/lib/auth.ts`, `src/app/api/me/**` |
| C Data | `src/lib/types.ts`, `src/lib/data.ts` |
| D Shell | `src/app/globals.css`, `src/app/layout.tsx`, `src/components/site/**` (nav, footer, tab bar); deletes `src/components/reveal.tsx` if unused |
| E Landing | `src/app/page.tsx`, `src/app/page.module.css`, `src/components/how/**` (Remotion players); deletes `src/components/remotion/**` |
| F1 Browse | `src/app/calendar/**`, `src/app/results/**` (replace old page with `results/[n]`), `src/app/p/**` |
| F2 Flows | `src/app/join/**`, `src/app/signin/**`, `src/app/post/**` |
| G Admin + cleanup | `src/app/admin/**`, `src/app/api/admin/heats/**`, `.env.example`, `README.md`; deletes `src/app/sign-in`, `src/app/sign-up`, `src/app/onboarding`, `src/app/about`, `src/app/api/admin/rsvps`, `scripts/luma-assets.ts` |

Not touched by anyone: `src/lib/pipeline.ts`, `ocr.ts`, `vision.ts`, `dhash.ts`, `db.ts`, `time.ts`, story routes.

## Rules for every part

- Next.js 16 in this repo. Read `web/node_modules/next/dist/docs/` for anything you are unsure of (proxy, params are Promises, etc.). `params` and `searchParams` are `Promise`s in pages and routes.
- TypeScript strict. No `any` unless unavoidable. Match the existing code style: 2 spaces, no semicolons, single quotes.
- Copy: never use em dashes. No placeholder text in UI copy except bracketed placeholders already in the mockups.
- Accessibility: real `<button>`, `<a>`, `<label>`; touch targets ≥ 44px; visible focus.
- Do not run `npm install`, do not commit, do not touch files outside your part. You may run `npx tsc --noEmit -p .` from `web/`; errors in files you do not own are expected while other parts are in flight.

## After the parts land (orchestrator)

1. `npx tsc --noEmit`, `npm run lint`, fix seams.
2. Abdullah applies migration 0003 (or approves it), sets Supabase Auth email template to include `{{ .Token }}`, sets custom SMTP, adds `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` to env.
3. Commit and push.
