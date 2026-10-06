# Heats

Free community 5Ks across New York. Show up, run, get stamped.
Next.js 16 · Clerk (auth) · Supabase (Postgres + Storage) · Vercel.

Brand kit: `../brand/heats-brandkit.html`.

## v1 in one line

A runner runs a 5K anywhere in Central Park inside the heat window, screenshots their
Strava-style activity card, and posts it. The server reads the card (OCR + a vision check) and
either stamps it automatically or sends it to a human. Stamped finishes land on the heat sheet
and on the runner's passport.

## Architecture

- **Every read and write goes through the Next.js server.** The browser never holds the service
  key. The only browser Supabase call is a **signed upload** to the private `proofs` bucket,
  using the publishable key.
- **One server-only Supabase client** (`src/lib/db.ts`) uses the service key. RLS is enabled on
  every table with **no policies**, so the anon/authenticated keys can read and write nothing.
- **Clerk only answers "who is this".** No Clerk-to-Supabase token setup. Admin is
  `publicMetadata.role === "admin"`.

## Run locally

```bash
npm install
cp .env.example .env.local   # then fill in the keys
npm run dev
```

## The pipeline

`POST /api/submissions` (`src/app/api/submissions/route.ts`, budget 30 s):

1. **Window check** against the server clock → 403 `window_closed`.
2. **Fetch the image** from storage. Reject over 8 MB or not PNG/JPEG/WebP.
3. **Fingerprints**: `sha256` for exact copies, `dhash` for near copies. Duplicate = same sha, or
   hamming ≤ 6 **and** the same parsed time and distance (two runners' cards over the same park
   look alike at the pixel level).
4. **In parallel**: Tesseract reads the stats band (`src/lib/ocr.ts`); OpenRouter vision
   (`src/lib/vision.ts`, `anthropic/claude-haiku-4.5`, strict JSON, 12 s timeout) reads the map.
5. **Decide** (`src/lib/pipeline.ts`): duplicate → not_strava → ocr_mismatch → distance →
   location → else auto-verified. If vision is unavailable the row goes to review with
   `vision_unavailable` — a model outage never blocks a runner.
6. **Upsert** the row. Resubmit allowed while `needs_review`/`rejected`, up to 5 attempts;
   a verified row is locked.

## Routes

| Route | What |
|---|---|
| `/` | Hero, the heat, medals, your passport summary |
| `/results` | Heat sheet (revalidates every 30 s) |
| `/post` | Public. Client state machine: idle → uploading → processing → stamped / review / error |
| `/onboarding` | Pick an alias |
| `/p/[alias]` | Public passport: stamps, medals, best 5K |
| `/admin` | Review queue with signed image URLs; verify / reject |
| `POST /api/me/profile` | Create the user row (alias + lowercased Clerk email) |
| `POST /api/submissions/upload-url` | Signed upload URL for `proofs` |
| `POST /api/submissions` | The pipeline |
| `POST /api/submissions/:id/flag` | "Numbers wrong?" → sends it back to review |
| `GET /api/story/heat/[number]` | "I'm running" share PNG |
| `GET /api/story/result?alias=&heat=` | "Stamped" share PNG |
| `GET /api/story/passport/[alias]` | Passport share PNG |
| `GET /api/admin/submissions?status=` | Queue |
| `POST /api/admin/submissions/:id/decision` | verify / reject |
| `POST /api/admin/rsvps/import` | Luma CSV (optional) |

## Launch checklist

1. **Supabase**: create a project (us-east-1). Run `supabase/migrations/0002_v1.sql` in the SQL
   editor. Copy the URL and service-role key into the env.
2. **Clerk**: create a "Heats" app, turn on Email code, Google and Apple, and put the keys in the
   env. Set your own user's `publicMetadata.role` to `admin`.
3. **OpenRouter**: put `OPENROUTER_API_KEY` in the env.
4. **Vercel**: import `web/`, add every variable from `.env.example`, and set
   `NEXT_PUBLIC_SITE_URL=https://heats.run`. Confirm the plan allows a 30 s function.
5. **Domain**: point it at Vercel and add Clerk's production DNS records.

## Medals

Three, all computed from stamped heats (`src/lib/medals.ts`), nothing stored:
**Founding Runner** (finish Heat 001), **Podium** (top three), **Closer** (last in a heat).
Podium and Closer only lock in once `now() > closes_at`.

## Schema

`supabase/migrations/0002_v1.sql` replaces `0001_init.sql`: `users`, `heats`, `submissions`,
`rsvps`, the `results` view, RLS on with no policies, and the private `proofs` bucket. It seeds
Heat 001 (`Chilly Central Park 5K`, opens `2026-10-10 00:00-04`, closes `2026-10-10 23:59:59-04`).

## Testing the pipeline

Drop real screenshots into `fixtures/` (see `fixtures/README.md`) and run:

```bash
npm run check:pipeline
```

Target: every number and the location right, at least 9 of 10. It exercises OCR and the
fingerprints only; it does not call the vision model or the database.

## Deployment notes

1. **Body limit.** Vercel caps request bodies around 4.5 MB and a 1080×1920 PNG can exceed it,
   so uploads go straight to Supabase via a signed URL and the API only receives a path.
2. **Tesseract on serverless is the main risk.** Language data is bundled (`eng.traineddata`);
   `next.config.ts` sets `serverExternalPackages` and `outputFileTracingIncludes`. **Test on a
   Vercel preview early.** If it misbehaves, the fallback is to send the stats band to the vision
   model too (~a tenth of a cent per image, no OCR dependency).
3. **`maxDuration`** is 30 s on the submissions route; confirm your Vercel plan allows it.
4. **Privacy.** A map screenshot can reveal where someone lives. The bucket is private; delete
   verified images after ~30 days and keep only the hashes.
