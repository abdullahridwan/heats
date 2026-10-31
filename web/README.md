# Heats

Free community 5Ks across New York. Show up, run, get stamped.
Next.js 16 · Supabase (Postgres, Auth, Storage) · Vercel.

Brand kit: `../brand/heats-brandkit.html`.

## What it is

Two tabs: **Calendar** and **Stamp case**. Every action starts from a heat on the calendar.

- A heat runs a whole weekend (Saturday 00:00 to Sunday 23:59, New York time) in one park. Each heat has its own postal stamp.
- **Join a heat** (upcoming heat): claim an @handle and email, then enter a 6-digit code sent to your inbox. After that the phone stays signed in and joining is one tap.
- **Submit your run** (live heat): upload a Strava-style screenshot. The pipeline verifies it and the runner gets that heat's stamp, postmarked.
- **Results** (past heat): ranked heat sheet. Each @handle links to that runner's stamp case.
- **Stamp case** (`/p/[alias]`): public. Earned stamps, plus empty slots for the other heats of the season.
- One stamp per heat per runner.

## Sign in

Email code sign in through Supabase Auth. There are no passwords. A runner enters their email, gets a 6-digit code, and types it in.

## Architecture

- **Server-mediated.** Every read and write goes through the Next.js server. The browser never holds the service key. The only browser Supabase calls are auth (publishable key) and a **signed upload** to the private `proofs` bucket.
- **One server-only Supabase client** (`src/lib/db.ts`) uses the service key.
- **RLS is on for every table with no policies**, so the anon and authenticated keys can read and write nothing directly.
- **Admin** is a single password (`ADMIN_PASSWORD`) that sets a signed session cookie (`ADMIN_SESSION_SECRET`). It is separate from runner accounts.

## Run locally

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev
```

## Routes

| Route | What |
|---|---|
| `/` | Landing page: what a heat is, how it works |
| `/calendar` | Calendar of heats: live, upcoming, past |
| `/join/[n]` | Join an upcoming heat (claim a handle, email code) |
| `/signin` | Email code sign in |
| `/post` | Submit a run for the live heat |
| `/p/[alias]` | Stamp case: public |
| `/results/[n]` | Heat sheet for one heat |
| `/admin` | Password protected. Review queue, heats editor |

### API

| Route | What |
|---|---|
| `POST /api/auth/start` | Send the sign-in code (and claim a handle for new runners) |
| `POST /api/auth/verify` | Check the code and sign in |
| `POST /api/auth/signout` | Sign out |
| `GET /api/handles/check?h=` | Is a handle available |
| `POST /api/signups` | Join an upcoming heat |
| `POST /api/submissions/upload-url` | Signed upload URL for `proofs` |
| `POST /api/submissions` | The pipeline (defaults to the live heat) |
| `POST /api/submissions/:id/flag` | "Numbers wrong?" sends it back to review |
| `GET /api/story/heat/[number]` | "I'm running" share PNG |
| `GET /api/story/result?alias=&heat=` | "Stamped" share PNG |
| `GET /api/story/passport/[alias]` | Stamp case share PNG |
| `POST /api/admin/login` | Admin sign in (`{ password }`) |
| `POST /api/admin/logout` | Admin sign out |
| `POST /api/admin/heats` | Create or update a heat |
| `GET /api/admin/submissions?status=` | Review queue |
| `POST /api/admin/submissions/:id/decision` | Verify or reject a submission |

## Setup checklist

1. **Database.** Apply `supabase/migrations/0003_weekly_heats.sql` to the Supabase project.
2. **Auth email.** In Supabase Auth, set the email OTP template to include `{{ .Token }}` so the email shows the 6-digit code.
3. **SMTP.** Configure custom SMTP in Supabase Auth. The built-in sender is rate limited and not suitable for launch.
4. **Environment.** Fill in every variable from `.env.example`, including `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET`.
5. **Vercel.** Import `web/`, add every variable from `.env.example`, set `NEXT_PUBLIC_SITE_URL` to the production URL, and confirm the plan allows a 30 s function.
6. **Heats.** Sign in at `/admin` and create the heats in the Heats section.

## The pipeline

`POST /api/submissions` (`src/app/api/submissions/route.ts`, budget 30 s):

1. **Window check** against the server clock. Outside the heat window: 403 `window_closed`.
2. **Fetch the image** from storage. Reject over 8 MB or not PNG/JPEG/WebP.
3. **Fingerprints**: `sha256` for exact copies, `dhash` for near copies. Duplicate = same sha, or hamming ≤ 6 **and** the same parsed time and distance (two runners' cards over the same park look alike at the pixel level).
4. **In parallel**: Tesseract reads the stats band in two passes (`src/lib/ocr.ts`: whole band, then a digits-only re-read under each label, with the time chosen by cross-checking pace × distance and a lost decimal point recovered the same way). OpenRouter vision (`src/lib/vision.ts`, `anthropic/claude-haiku-4.5`, strict JSON, 12 s timeout) reads the map.
5. **Decide** (`src/lib/pipeline.ts`): duplicate → not_strava → ocr_mismatch → distance → location → else auto-verified. If vision is unavailable the row goes to review with `vision_unavailable`. A model outage never blocks a runner.
6. **Upsert** the row. Resubmit allowed while `needs_review` or `rejected`, up to 5 attempts. A verified row is locked.

## Schema

`supabase/migrations/0002_v1.sql` created `users`, `heats`, `submissions`, the `results` view, RLS on with no policies, and the private `proofs` bucket.

`supabase/migrations/0003_weekly_heats.sql` adds `heats.park` and `heats.scene` (stamp scene key) and the `signups` table, and seeds the weekend heats. `users.id` holds the Supabase Auth user id.

## Testing the pipeline

Drop real screenshots into `fixtures/` (see `fixtures/README.md`) and run:

```bash
npm run check:pipeline
```

Target: every number right, at least 9 of 10. It exercises OCR and the fingerprints only; it does not call the vision model or the database. `fixtures/synthetic-*` are drawn cards (regression only). Add real Strava screenshots next to them, each with a `.json` of the expected values.

## Deployment notes

1. **Body limit.** Vercel caps request bodies around 4.5 MB and a 1080×1920 PNG can exceed it, so uploads go straight to Supabase via a signed URL and the API only receives a path.
2. **Tesseract on serverless is the main risk.** The language data (`assets/tessdata/eng.traineddata`, tracked in git) and the WASM engine (`tesseract.js-core`, ~43 MB) are listed in `outputFileTracingIncludes` because Tesseract loads them dynamically. **Test on a Vercel preview early.** If it misbehaves, the fallback is to send the stats band to the vision model too (about a tenth of a cent per image, no OCR dependency).
3. **`maxDuration`** is 30 s on the submissions route. Confirm your Vercel plan allows it.
4. **Privacy.** A map screenshot can reveal where someone lives. The bucket is private. Delete verified images after about 30 days and keep only the hashes.
