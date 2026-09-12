# URL Shortener

A full-stack URL shortener with user authentication, link management, click tracking, analytics, and automatic link health checks.

## Stack

- **Backend:** Node.js 20, Fastify, Prisma, TypeScript
- **Task Queue:** BullMQ + Redis (daily link health checks)
- **Database:** PostgreSQL
- **Frontend:** React + Vite (served by the API in production)
- **Auth:** JWT + Argon2id password hashing

## Quick Start (local)

```bash
# Start postgres and redis
docker compose up postgres redis -d

# Terminal 1 - API
cd backend && npm install && cp .env.example .env
npx prisma migrate deploy && npm run dev

# Terminal 2 - worker
cd backend && npm run worker

# Terminal 3 - frontend (dev with hot reload)
cd frontend && npm install && npm run dev
```

- API: http://localhost:8000
- Frontend (dev): http://localhost:5173

### Production build (API serves frontend)

```bash
npm run build          # builds frontend into backend/public + compiles API
cd backend && npm run start:prod
```

Open http://localhost:8000 — dashboard and short links on the same URL.

---

## Deploy to Railway (recommended)

Everything runs on Railway: **Postgres + Redis + API (with frontend) + Worker**.

### 1. Push to GitHub

```bash
git init && git add . && git commit -m "Initial commit"
# push to GitHub
```

### 2. Create Railway project

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub**
2. Select your repo

### 3. Add databases

In the project, click **+ New** → **Database** → **PostgreSQL**  
Click **+ New** → **Database** → **Redis**

### 4. Web service (API + frontend)

Railway auto-creates a service from your repo. Configure it:

| Setting | Value |
|---------|-------|
| **Build Command** | `cd backend && npm install && npm run build:full` |
| **Start Command** | `cd backend && npm run start:prod` |

Or use the included [`railway.toml`](railway.toml) at the repo root.

**Environment variables:**

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (reference from Postgres plugin) |
| `REDIS_URL` | `${{Redis.REDIS_URL}}` (reference from Redis plugin) |
| `JWT_SECRET` | long random string |
| `APP_BASE_URL` | `https://<your-api-service>.up.railway.app` |
| `PORT` | `8000` (or leave unset — Railway injects `PORT`) |

> `CORS_ORIGINS` is optional when the frontend is served from the same service.

Generate a public domain: service → **Settings** → **Networking** → **Generate Domain**.

Set `APP_BASE_URL` to that domain (short links use this URL).

### 5. Worker service

1. **+ New** → **GitHub Repo** → same repo
2. Name it `worker`

| Setting | Value |
|---------|-------|
| **Build Command** | `cd backend && npm install && npm run build:full` |
| **Start Command** | `cd backend && npm run worker:prod` |

Use the **same environment variables** as the web service (`DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `APP_BASE_URL`).

See [`railway.worker.toml`](railway.worker.toml) for reference.

### 6. Verify

- `https://your-app.up.railway.app` → landing page
- `https://your-app.up.railway.app/api/health` → `{ "status": "ok" }`
- Sign up, create a link, visit `https://your-app.up.railway.app/abc123`

### Railway architecture

```
Railway Project
├── postgres     (plugin)
├── redis        (plugin)
├── api          (web)    → API + React SPA + short-link redirects
└── worker       (worker) → daily health checks via BullMQ
```

---

## Docker Compose

```bash
docker compose up --build
```

Builds frontend into the API image. API at http://localhost:8000.

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/signup` | No | Register |
| POST | `/api/auth/login` | No | Login |
| GET | `/api/auth/me` | Yes | Current user |
| DELETE | `/api/auth/account` | Yes | Delete account |
| POST | `/api/links` | Yes | Create short link |
| GET | `/api/links` | Yes | List links |
| GET | `/api/links/{id}` | Yes | Get link |
| DELETE | `/api/links/{id}` | Yes | Delete link |
| POST | `/api/links/{id}/reactivate` | Yes | Reactivate link |
| GET | `/api/links/{id}/analytics` | Yes | Link analytics |
| GET | `/{shortCode}` | No | Public redirect |

## Features

- 6-character case-insensitive alphanumeric short codes
- SSRF-safe URL validation (HTTP 200 final response required)
- 30-day inactivity rule with owner reactivation
- Daily BullMQ health checks mark dead destinations inactive
- Atomic click counter with access event logging
- Cascade delete on account removal
