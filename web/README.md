# Heats

Free community 5Ks across New York. Show up, run, get stamped.
Next.js 16 · Clerk (auth) · Supabase (Postgres + Storage) · Vercel.

Brand kit: `../brand/heats-brandkit.html`. Plan and implementation guide: Notion → Aapallo → Ideas → Heats.

## Run locally

```bash
npm install
npm run dev   # .env.local already has temporary Clerk dev keys; add Supabase keys there (see .env.example)
```

Without Supabase keys the site runs read-only on the seeded season, and `/p/demo` shows a sample passport.

## Launch checklist

1. **Supabase**: create a project (us-east-1). Run `supabase/migrations/0001_init.sql` in the SQL editor. Copy the URL, publishable key and secret key into the env.
2. **Clerk → Supabase**: in Clerk, activate the Supabase integration and copy the Clerk domain. In Supabase, go to Authentication → Sign In / Providers → Third-party auth → Clerk, and paste the domain.
3. **Clerk**: the current keys are temporary (accountless). Run `npx clerk@latest auth login` to claim the app, or create a "Heats" app and swap the keys. Turn on Email code, Google and Apple.
4. **Vercel**: import `web/` and add every variable from `.env.example`. Set `NEXT_PUBLIC_SITE_URL=https://heats.run`.
5. **Domain**: buy heats.run, point it at Vercel, and add Clerk's production DNS records.
6. **Admin**: sign up, then copy your Clerk user id into `ADMIN_USER_IDS` and redeploy. Review results at `/admin`.

## Map

| Route | What |
|---|---|
| `/` | Hero, countdown, season calendar |
| `/h/001` | Race page: cover, countdown, join, heat sheet |
| `/h/001/post` | Post your time (screenshot → `proofs` bucket) |
| `/p/[alias]` | Passport: stamps + medals |
| `/onboarding` | Pick alias + home park |
| `/admin` | Review screenshots, set heat status |
| `/api/ics/001` | Calendar invite |

Art (stamps, medals, courses) lives in `src/lib/art.ts`, ported 1:1 from the brand kit. Park colors are in `src/lib/themes.ts`, and medal rules are in `src/lib/medals.ts`.
