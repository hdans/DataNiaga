# DataNiaga Deployment Guide

This guide explains how to deploy the React (Vite) frontend to Vercel and the FastAPI backend to a production host so your app is publicly accessible.

Updated structure:

```
dataniaga/
├── frontend/        ← React + Vite (Vercel)
│   ├── src/
│   ├── index.html
│   └── ...
├── backend/         ← FastAPI (Render/Railway)
│   ├── main.py
│   ├── database.py
│   └── ...
└── frontend/dist/   ← built frontend output (Vercel)
```

## Overview
- Frontend: Vite + React → Vercel (static hosting + CDN).
- Backend: FastAPI + SQLAlchemy + Pandas/LightGBM → Render/Railway/Fly (long-running web service with Postgres).
- Communication: Frontend uses `VITE_API_URL` to reach backend (HTTPS). Backend CORS is controlled via the `ALLOWED_ORIGINS` env var.

> Note: Deploying the heavy Python backend on Vercel Functions is not recommended (cold starts, timeouts, package size). A proper app host with persistent storage is better.

## Prerequisites
- GitHub repo connected to Vercel (for frontend) and to your backend host (Render/Railway/Fly).
- A managed PostgreSQL database (recommended) or persistent disk if you must use SQLite.

---

## 1) Deploy the Backend (FastAPI)

### Render (recommended example)
1. Create a new Web Service in Render
   - Connect your GitHub repo.
   - Root directory: repository root.
2. Build command
   ```bash
   pip install -r backend/requirements.txt
   ```
3. Start command
   ```bash
   uvicorn backend.main:app --host 0.0.0.0 --port $PORT
   ```
4. Instance type
   - Pick an instance (2GB+ recommended for ML stacks if budget allows).
5. Database
   - Add a Managed PostgreSQL database in Render.
   - Copy the connection string and set `DATABASE_URL` in the Web Service’s Environment.
6. Environment variables (Web Service)
   - `DATABASE_URL`: the Postgres connection string
   - `ALLOWED_ORIGINS`: comma-separated allowed origins, e.g.
     ```
     https://your-frontend.vercel.app,https://www.yourdomain.com
     ```
   - (Optional) `PYTHONUNBUFFERED=1`
7. Deploy
   - Render will build and start the service.
   - Verify health: open `https://YOUR-BACKEND.onrender.com/api/health` (should return JSON with `status: healthy`).

> SQLite is supported locally, but for production use Postgres. This repo already supports `DATABASE_URL` via `backend/database.py`.

### Railway (alternative)
- Create a New Project → Deploy from GitHub.
- Add a PostgreSQL plugin.
- Set `DATABASE_URL` from the plugin’s connection string.
- Start command identical to above.

### Fly.io (alternative)
- Use `fly launch` to generate the config.
- Provision Postgres with `fly postgres create` and connect via secrets.
- Start Uvicorn with the same command.

---

## 2) Deploy the Frontend (Vercel)

1. Import Project
   - Vercel → New Project → Import your GitHub repo.
   - Framework preset: Vite (auto-detected).
2. Build settings
   - Project root on Vercel: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Environment Variables:
     - `VITE_API_URL` = `https://YOUR-BACKEND.onrender.com`
3. Environment Variables (Project → Settings → Environment Variables)
   - `VITE_API_URL`: your backend base URL, e.g.
     ```
     https://YOUR-BACKEND.onrender.com
     ```
4. Deploy
   - Trigger a deployment. Vite inlines `VITE_API_URL` at build time.
5. Custom domain (optional)
   - Add a custom domain in Vercel and point DNS records.
6. Confirm CORS
   - Ensure your backend `ALLOWED_ORIGINS` includes your Vercel domain.

---

## 3) Verify End-to-End

- Frontend should load on `https://your-frontend.vercel.app`.
- API requests should hit `https://YOUR-BACKEND.onrender.com`.
- Quick checks:
  - `GET https://YOUR-BACKEND.onrender.com/api/health`
  - `GET https://YOUR-BACKEND.onrender.com/` → should return API banner JSON
  - Upload flow: use the app’s upload UI and watch logs in your backend host.

---

## 4) Optional: Vercel Functions for FastAPI (Not Recommended for ML)

If you still want to colocate the API on Vercel (with limitations):

- Create `api/index.py` (export variable `app`):
  ```python
  # api/index.py
  from backend.main import app  # FastAPI app
  ```
- Create `vercel.json`:
  ```json
  {
    "functions": {
      "api/*.py": { "runtime": "python3.11" }
    }
  }
  ```
- Set frontend `VITE_API_URL` to `/api` on Vercel.

Caveats:
- Large scientific packages (NumPy/Pandas/LightGBM) increase boot times.
- Serverless time/memory limits may terminate long-running jobs (file uploads, training, forecasting).
- SQLite is ephemeral; use external Postgres.

---

## 5) Troubleshooting

- CORS errors: set `ALLOWED_ORIGINS` on backend to your exact Vercel domain(s). Remove `*` in production.
- Mixed content: ensure both frontend and backend are HTTPS.
- 404s from API: confirm `VITE_API_URL` is set in Vercel and matches deployed backend.
- Timeouts/Memory: use a larger instance/tier on the backend host.
- DB errors: verify `DATABASE_URL` and that your tables were created on first run.

---

## Reference
- Backend start: `uvicorn backend.main:app --host 0.0.0.0 --port 8000`
- Backend health: `/api/health`
- Frontend build: `npm run build` → `dist/`
