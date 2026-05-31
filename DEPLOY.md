# Deploying Growth Engine to Railway

Railway gives you a permanent HTTPS URL your client can open from any browser,
with no "keep your machine on" requirement.

---

## Prerequisites

- A free [Railway account](https://railway.app) (sign up with GitHub)
- A free [GitHub account](https://github.com) — Railway deploys from a repo
- Your `OPENAI_API_KEY`

---

## Step 1 — Push the project to GitHub

Open a terminal in `D:\mubashir\growthengine` and run:

```cmd
git init                          # skip if already a git repo
git add .
git commit -m "initial deploy"
```

Then create a new **private** repo on GitHub (github.com → New repository)
and push:

```cmd
git remote add origin https://github.com/YOUR_USERNAME/growth-engine.git
git branch -M main
git push -u origin main
```

---

## Step 2 — Create a Railway project

1. Go to [railway.app](https://railway.app) and click **New Project**
2. Choose **Deploy from GitHub repo**
3. Authorise Railway to access your GitHub account, then select **growth-engine**
4. Railway detects the `Dockerfile` automatically and starts building

The first build takes ~5 minutes (it installs SWI-Prolog + Python packages).

---

## Step 3 — Set environment variables

While the build runs, click your service → **Variables** tab → **Add Variable**:

| Variable | Value |
|---|---|
| `OPENAI_API_KEY` | `sk-...your key...` |
| `ANTHROPIC_API_KEY` | `sk-ant-...your key...` (if used) |
| `OMEGACLAW_SYNTHETIC_CONVERSIONS` | `0` (or `1` for demo mode) |

Railway automatically sets `PORT` — the Dockerfile already reads it.

> **Never** commit your `.env` file. The `.dockerignore` already blocks it.

---

## Step 4 — Get your public URL

Once the deploy turns green:

1. Click your service → **Settings** → **Networking** → **Generate Domain**
2. You get a URL like `https://growth-engine-production.up.railway.app`

Share that URL with your client. It's live 24/7.

---

## Step 5 — Re-deploy after code changes

Every `git push` to `main` triggers an automatic re-deploy:

```cmd
git add .
git commit -m "fix: ..."
git push
```

---

## Quick-share alternative (while the Railway deploy is building)

If you need to share the app *right now* without waiting for Railway:

1. Install ngrok: https://ngrok.com/download
2. Sign up for a free account and run `ngrok config add-authtoken YOUR_TOKEN`
3. With the app already running on port 8001, run:
   ```cmd
   ngrok http 8001
   ```
4. Share the `https://....ngrok-free.app` URL

The ngrok URL is temporary (changes on restart) but works instantly.
Railway is the permanent solution.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Build fails on `janus-swi` | Harmless — app still works with Python PLN fallback. Check logs for `petta_ok = False`. |
| `500` on `/api/pln-spec` | Check Railway logs → likely `OMEGACLAW_PYTHON` path. The Dockerfile sets it to `/usr/bin/python3`. |
| Images not generating | Verify `OPENAI_API_KEY` is set correctly under Variables. |
| `Cannot find module` on Node start | `npm ci` in the Dockerfile should handle this. Re-deploy to force a clean build. |
