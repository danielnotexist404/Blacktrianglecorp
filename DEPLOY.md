# Deploy guide — BTG Trader

End-to-end playbook for getting the web app live on Vercel with Supabase
as auth + DB backend. The strategy engine is **not** part of this deploy;
it runs as a separate process (covered in a later guide).

Estimated time, end-to-end: **15–25 minutes**, almost all of it clicking.

## What you need

- A GitHub account with this repo pushed (private or public).
- A Supabase account (sign up at supabase.com — free).
- A Vercel account (sign up at vercel.com — free).

If you want to keep BTG fully isolated from existing work, create the
Supabase + Vercel containers as **a new organisation / team** under your
existing logins. See the section "Isolation" at the bottom.

---

## 1. Push to GitHub

You already have the local repo at `C:\Users\mamte\Desktop\Trade_Bot`.

```powershell
cd C:\Users\mamte\Desktop\Trade_Bot

# Install git first, if you haven't already:
#   winget install Git.Git

git init
git add .
git commit -m "Initial commit"

# Replace YOUR_USER with your new GitHub username
git branch -M main
git remote add origin https://github.com/YOUR_USER/btg-trader.git
git push -u origin main
```

The `.gitignore` at the repo root already excludes `node_modules/`,
`.next/`, `.env.local`, `.venv/`, secrets, IDE files, and `.claude/`.
Nothing sensitive will be pushed.

---

## 2. Create Supabase project

1. Log in to **supabase.com** → top-left org selector → **New
   organisation** if you want BTG in its own org. Name it `BTG` or
   similar.
2. Inside that org → **New project**.
   - Name: `btg-trader`
   - Region: pick closest to your users (Frankfurt / Tokyo / Singapore)
   - Database password: generate + save to a password manager
3. Wait ~2 minutes for provisioning.

Then apply the schema:

4. **SQL Editor** → open `supabase/migrations/0001_initial_schema.sql`
   from this repo → paste → **Run**. You should see "Success. No rows
   returned."
5. **Authentication → Providers** → enable **Email** (already on by
   default). Optionally enable **Google** with OAuth credentials.

Grab the keys you'll need:

6. **Project Settings → API** → copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon`/`publishable` key → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret)

---

## 3. Create Vercel project

1. Log in to **vercel.com** → top-left team selector → **Create team**
   if you want BTG in its own team. Hobby plan (free) is fine.
2. **Add New… → Project** → import your `btg-trader` GitHub repo.
3. Configure:
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `apps/web` ← important, this is a monorepo
   - **Build Command:** leave default (`pnpm build`)
   - **Output Directory:** leave default
4. **Environment Variables** — paste in:
   - `NEXT_PUBLIC_SUPABASE_URL` = the URL from step 2.6
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = the anon/publishable key
   - `SUPABASE_SERVICE_ROLE_KEY` = the service-role key
5. Click **Deploy**.

Vercel will build and give you a URL like `btg-trader-web.vercel.app`.

Every future `git push origin main` will auto-deploy.

---

## 4. Wire auth redirects

Supabase needs to know which URLs are allowed as auth callbacks.

1. Supabase → **Authentication → URL Configuration**
2. **Site URL:** `https://btg-trader-web.vercel.app` (your Vercel URL)
3. **Redirect URLs:** add
   - `https://btg-trader-web.vercel.app/**`
   - `http://localhost:3000/**` (for local dev)

---

## 5. Smoke test

Visit your Vercel URL.

- ✅ Landing page loads
- ✅ `/dashboard` chart pulls live Bybit prices and ticks
- ✅ `/login` form renders
- ✅ Footer links reach `/terms`, `/privacy`, `/risk-disclosure`

Auth and DB-backed flows (signup, persistent demo/live mode, API-key
storage) are **not yet wired in the code** — that's the next chunk of
work, which I'll do once Supabase is provisioned and you've shared the
project ref.

---

## Isolation: keeping BTG separate from existing work

Both Supabase and Vercel use **organisations / teams** as the isolation
boundary:

- Each Supabase org has its own free-tier quota (2 active projects),
  its own billing, its own dashboard view.
- Each Vercel team has its own project list, its own env vars, its own
  Domains.

Creating a new org/team under your existing login gives you complete
isolation while keeping a single set of credentials. If you ever want
to fully spin BTG out, both platforms support transferring projects to
a different account.

If you want **completely separate logins** (different email entirely),
sign up Supabase + Vercel with a new email. You'll then need to do the
deploy steps above signed in as that new identity.

---

## What I (Claude) need from you to take over

Once your Supabase project is up and the repo is on GitHub:

1. The new Supabase project ref (the part of the URL before `.supabase.co`)
2. The Vercel project URL once it's deployed
3. Confirmation that you've completed steps 1–4 above

With those, I'll:

- Wire `@supabase/ssr` into the Next.js app (real signup/sign-in)
- Add auth middleware so authed pages require sign-in
- Replace the simulated Bybit key verification with a real server
  action that calls Bybit's `/v5/user/query-api` and rejects any
  `Withdraw` permission
- Persist demo/live mode + risk caps + symbol selection to
  `user_preferences` instead of `localStorage`
- Add a manual git commit / push step (or use GitHub Actions if you
  prefer) so I can keep updating the deployed app

---

## Troubleshooting

**`pnpm: command not found` on Vercel** — Vercel auto-detects pnpm from
the lockfile. If the build fails to find pnpm, add `pnpm` to
`packageManager` in `apps/web/package.json` (e.g.
`"packageManager": "pnpm@10.33.0"`).

**Build fails with "Module not found: lightweight-charts"** — make sure
`pnpm-lock.yaml` is committed and Vercel's "Root Directory" is set to
`apps/web`.

**Auth redirects to localhost after sign-in on production** — you
missed step 4. Update Site URL + Redirect URLs in Supabase.

**RLS policy errors** — run the migration again. The script is
idempotent and safe to re-run.
