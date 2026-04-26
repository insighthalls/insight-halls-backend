# Deploying Insight Halls — Frontend + Backend on Vercel

This project now deploys as a **single Vercel app**: the website (HTML in `public/`) and the API (Express in `api/index.js`) live at the same URL. No CORS, no separate frontend host.

---

## What you have now

```
Insight halls backend/
├── api/
│   └── index.js          ← Express API (serverless on Vercel)
├── public/
│   ├── index.html        ← landing page + login
│   ├── admin_dashboard.html
│   └── partner_dashboard.html
├── package.json
├── vercel.json           ← tells Vercel how to route /api vs static files
├── .env                  ← LOCAL ONLY — never commit
├── .gitignore
└── DEPLOY.md             ← this file
```

The HTML files now use `const API_URL = '/api'` (relative), so they automatically work both locally and on Vercel.

---

## Step 1 — Confirm your Supabase tables exist

The backend expects these tables in your Supabase project (`ejmophbtpghszliuodyn`):

- `users` — columns: `id`, `email`, `name`, `role` (`'Administrator'` or `'Partner'`), `status` (`'Active'`)
- `inquiries` — `sender_name`, `sender_email`, `sender_phone`, `inquiry_type`, `sector`, `message`, `status`, `response`, `created_at`, `updated_at`
- `projects` — `name`, `client_name`, `sector`, `status`, `budget`, `description`, `percent_complete`, `created_at`
- `partners` — `user_id`, `company_name`, `phone`, etc.
- `partner_funding` — `partner_id`, `project_id`, `amount`, `status`, `verified_at`
- `partner_dashboard` — view/table used by `/api/partners`

Open https://supabase.com/dashboard, pick your project, and confirm each of these. Add the six login users to `users` if not there:

```
mayendayendab@gmail.com           Administrator   Active
isaac.mzokomera@insighthalls.com  Partner         Active
webster.chipwaila@insighthalls.com Partner        Active
basiwel.mayendayenda@insighthalls.com Partner     Active
misheck@insighthalls.com          Partner         Active
adam.abdulrasheed@insighthalls.com Partner        Active
```

---

## Step 2 — Push to GitHub

You already have a git repo initialized in this folder.

In a terminal at `C:\Users\Administrator\Downloads\Insight halls backend`:

```bash
git add .
git commit -m "Restructure for Vercel single-deploy"
```

If you haven't created a GitHub repo yet:

1. Go to https://github.com/new
2. Repo name: `insight-halls` (or whatever you like)
3. Public, no README/license/gitignore (you already have one)
4. Click **Create repository**
5. Copy the commands GitHub shows you and run them. Roughly:

```bash
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/insight-halls.git
git push -u origin main
```

If you already added a remote previously, just `git push`.

**Verify on GitHub** that you see `api/`, `public/`, `package.json`, `vercel.json` — and that **`.env` is NOT** there.

---

## Step 3 — Deploy on Vercel

1. Go to https://vercel.com → sign in with GitHub.
2. Click **Add New → Project**.
3. Find your `insight-halls` repo → click **Import**.
4. **Framework Preset:** leave as "Other".
5. **Root Directory:** leave blank.
6. **Build / Output / Install commands:** leave blank.
7. **Environment Variables** — click **Add** for each of these:

   | Name | Value |
   |---|---|
   | `SUPABASE_URL` | `https://ejmophbtpghszliuodyn.supabase.co` |
   | `SUPABASE_ANON_KEY` | `sb_publishable_G7_ZYqV_RNTkjFOR5s16FA_8tX6P8uJ` |
   | `JWT_SECRET` | a long random string, at least 32 chars (use https://www.random.org/strings/) |
   | `NODE_ENV` | `production` |

   ⚠️ Don't reuse the placeholder JWT secret — generate a real random one. If it leaks, anyone can forge login tokens.

8. Click **Deploy**.
9. Wait ~1 minute for the green check. You'll get a URL like `https://insight-halls.vercel.app`.

---

## Step 4 — Test it live

Visit your Vercel URL. You should see the landing page.

Quick smoke tests:

- **Health check:** `https://YOUR-URL/api/health` → should return `{"success":true,"message":"Server is running",...}`
- **Login:** click Login, try `isaac.mzokomera@insighthalls.com` / `partner123` → should land on the partner dashboard.
- **Admin:** log out, try `mayendayendab@gmail.com` / `admin123` → should land on the admin dashboard.
- **Inquiry form:** fill out "Request a Quote" on the landing page → check `inquiries` table in Supabase to see the new row.

If something breaks, in Vercel click your project → **Logs** to see the error.

---

## Step 5 — (Optional) Custom domain

In Vercel → your project → **Settings → Domains** → Add. Vercel walks you through DNS records for whatever domain you own (e.g. `insighthalls.com`).

---

## After deploy: every code change goes live automatically

```bash
# edit files locally, then:
git add .
git commit -m "what you changed"
git push
```

Vercel sees the push and redeploys in ~30 seconds.

---

## ⚠️ Things to fix BEFORE real users hit it

1. **Hardcoded passwords.** `api/index.js` has a `validPasswords` map. Replace it with bcrypt-hashed passwords stored in the `users.password_hash` column. The `bcrypt` package is already installed; the `hashPassword` / `verifyPassword` helpers are already in the file but unused — wire them into the login route.
2. **CORS.** Currently `cors()` allows everything. Once you have a custom domain, restrict it: `cors({ origin: 'https://insighthalls.com' })`.
3. **The `.env` file.** Already in `.gitignore`, but double-check it didn't slip into your first commit (`git log --all --full-history -- .env` should be empty).
4. **JWT_SECRET.** Make sure the value you put in Vercel env vars is genuinely random, not the placeholder.
5. **Admin dashboard mock data.** The new admin dashboard now reads real inquiries/projects/partners from Supabase. If your Supabase tables are empty it will show "No inquiries yet." — that's expected.

---

## Troubleshooting

**Login returns "Invalid credentials" but the email/password are right.**
The user row in Supabase needs `status = 'Active'` and the email must match exactly (no trailing spaces).

**`/api/health` works but login returns 500.**
Almost always wrong env vars. Check Vercel → Settings → Environment Variables.

**Frontend loads but `/api/...` is 404.**
Means `vercel.json` didn't get picked up. Confirm it's at the repo root and committed.

**"Cannot find module 'express'".**
Vercel didn't run `npm install`. Confirm `package.json` is at the repo root.
