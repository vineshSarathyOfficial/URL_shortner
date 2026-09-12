# Snip — URL Shortener

**Live app:** [urlshortner-vinedev.up.railway.app](https://urlshortner-vinedev.up.railway.app)

A full-stack URL shortener with user authentication, link management, click analytics, and automatic link health checks. The React frontend is served by the Fastify API in production — one URL for the dashboard, API, and short-link redirects.

## Features

- **Instant shortening** — 6-character case-insensitive alphanumeric short codes
- **Click analytics** — total clicks, daily trends, and recent access history per link
- **Smart lifecycle** — links auto-deactivate after 30 days of inactivity; owners can reactivate with one click
- **SSRF-safe validation** — destinations must be publicly reachable and return HTTP 200 (redirects followed)
- **Daily health checks** — BullMQ worker marks dead destinations as inactive
- **Atomic click tracking** — counter increments and access events logged in a single transaction
- **Account management** — cascade delete removes all links when an account is deleted

## Stack

| Layer | Technology |
|-------|------------|
| Backend | Node.js 20, Fastify, Prisma, TypeScript |
| Frontend | React, Vite (Clay-inspired UI) |
| Database | PostgreSQL |
| Queue | BullMQ + Redis |
| Auth | JWT + Argon2id |
| Hosting | Railway |

## Quick Start (local)

```bash
# Start Postgres and Redis
docker compose up postgres redis -d

# Terminal 1 — API
cd backend && npm install && cp .env.example .env
npx prisma migrate deploy && npm run dev

# Terminal 2 — worker (daily health checks)
cd backend && npm run worker

# Terminal 3 — frontend (dev with hot reload)
cd frontend && npm install && npm run dev
```

| Service | URL |
|---------|-----|
| API | http://localhost:8000 |
| Frontend (dev) | http://localhost:5173 |

### Production build (API serves frontend)

```bash
npm run build          # builds frontend into backend/public + compiles API
cd backend && npm run start:prod
```

Open http://localhost:8000 — dashboard and short links on the same origin.

---

## Deploy to Railway

Everything runs on Railway: **Postgres + Redis + Web (API + frontend) + Worker**.

### 1. Push to GitHub

```bash
git add .
git commit -m "Your message"
git push origin main
```

### 2. Create Railway project

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub**
2. Select this repo

### 3. Add databases

In the project canvas, click **+ New** twice:

1. **Database** → **PostgreSQL**
2. **Database** → **Redis**

### 4. Web service (API + frontend)

Click the **GitHub repo service** (not Postgres or Redis) → **Variables**:

| Variable | How to set |
|----------|------------|
| `DATABASE_URL` | **Add Reference** → Postgres → `DATABASE_URL` |
| `REDIS_URL` | **Add Reference** → Redis → `REDIS_URL` |
| `JWT_SECRET` | Raw value — generate with `openssl rand -base64 48` |
| `APP_BASE_URL` | Your public Railway domain (set after step 5) |

Do **not** set `PORT` — Railway injects it automatically.

Build and start commands are in [`railway.toml`](railway.toml):

| Setting | Value |
|---------|-------|
| Build | `cd backend && npm install && npm run build:full` |
| Start | `cd backend && npm run start:prod` |

### 5. Generate a public domain

1. GitHub service → **Settings** → **Networking** → **Public Networking**
2. Click **Generate Domain** (port **8080** when prompted)
3. Copy the URL (e.g. `https://urlshortner-vinedev.up.railway.app`)
4. Add it to **Variables** as `APP_BASE_URL` (no trailing slash)

### 6. Worker service

1. **+ New** → **GitHub Repo** → same repo
2. Rename the service to `worker`
3. **Settings** → set **Start Command** to `cd backend && npm run worker:prod`
4. Add the **same variables** as the web service

See [`railway.worker.toml`](railway.worker.toml) for reference.

### 7. Verify

| URL | Expected |
|-----|----------|
| `https://your-app.up.railway.app` | Landing page |
| `https://your-app.up.railway.app/api/health` | `{"status":"ok"}` |
| Sign up → create link → visit `/{code}` | Redirect works |

### Railway architecture

```
Railway Project
├── postgres     (plugin)
├── redis        (plugin)
├── web          → API + React SPA + short-link redirects
└── worker       → daily health checks via BullMQ
```

---

## Docker Compose

```bash
docker compose up --build
```

Builds the frontend into the API image. App at http://localhost:8000.

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
| GET | `/api/health` | No | Health check |
| GET | `/{shortCode}` | No | Public redirect |

## Environment Variables

See [`backend/.env.example`](backend/.env.example):

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string (`REDIS_PRIVATE_URL` also supported on Railway) |
| `JWT_SECRET` | Secret for signing JWT tokens |
| `APP_BASE_URL` | Public base URL for generated short links |
| `CORS_ORIGINS` | Optional in dev; not needed when frontend is served by the API |
| `PORT` | Server port (default `8000`; Railway sets this automatically) |
