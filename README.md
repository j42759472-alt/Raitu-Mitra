# Raitu Mitra Website

Responsive web frontend for the Raitu Mitra agriculture marketplace — feature parity with the Android/Expo app.

One **Express** server serves the Vite-built SPA and same-origin `/api/*` routes (chatbot, Cashfree, search expand) — no separate Supabase Edge Functions required for the website.

## Requirements

- Node.js 18+
- npm

## Setup

```bash
cd website
npm install
cp .env.example .env
```

Edit `.env` with your keys (see `.env.example` for build-time vs runtime variables).

### Build-time (Vite)

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_BASE=
```

### Runtime (Express server)

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GROQ_API_KEY=your-groq-key
CASHFREE_APP_ID=TEST100xxxxxxxxxx
CASHFREE_SECRET_KEY=your-cashfree-secret
CASHFREE_ENV=sandbox
```

## Development

**Frontend only** (API calls proxied to port 8080):

```bash
npm run dev
```

**Full stack** (run in two terminals):

```bash
# Terminal 1 — API + static (after build, or with existing dist/)
npm run build && npm start

# Terminal 2 — Vite dev server with /api proxy
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Production build

```bash
npm run build
npm start
```

Listens on `PORT` (default `8080`). Health check: `GET /api/health`.

## Features

- Phone + password auth (Supabase `users` table)
- Home catalog, search, category browse, sell listings
- Workforce hire/register, orders with PIN completion, realtime chat
- Wallet restrictions, Cashfree Pay Now, payment history
- Government schemes, notifications, feedback, AI chatbot
- Leaflet map location picker, transport route
- English / Telugu (i18next)
- Responsive layout: bottom tabs on mobile, sidebar on desktop (≥900px)

## Tech stack

- React 19 + TypeScript + Vite
- React Router 7, Zustand, i18next
- Express (Node ESM) for SPA + API
- Supabase JS, Leaflet, Lucide icons

## Deploy on Railway (GitHub)

This folder includes `Dockerfile` and `railway.json` for a single-service deploy (static + API).

1. Push the repo to GitHub (include the `website/` folder).
2. In [Railway](https://railway.com): **New Project → Deploy from GitHub repo**.
3. Select this repository.
4. Open the new service → **Settings**:
   - **Root Directory**: `website`
   - Builder should pick up `Dockerfile` (also declared in `railway.json`)
5. **Variables**:

   | Variable | When | Example |
   |----------|------|---------|
   | `VITE_SUPABASE_URL` | Build | `https://xxxx.supabase.co` |
   | `VITE_SUPABASE_ANON_KEY` | Build | anon/public key |
   | `VITE_API_BASE` | Build | leave empty (same origin) |
   | `SUPABASE_URL` | Runtime | same as Vite URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | Runtime | service role key |
   | `GROQ_API_KEY` | Runtime | Groq API key |
   | `CASHFREE_APP_ID` | Runtime | Cashfree App ID |
   | `CASHFREE_SECRET_KEY` | Runtime | Cashfree secret |
   | `CASHFREE_ENV` | Runtime | `sandbox` or `production` |

6. **Networking** → **Generate Domain** (health check: `/api/health`).
7. Redeploy after changing any `VITE_*` variable (they are baked into the JS bundle).

### Local Docker smoke test

```bash
cd website
docker build \
  --build-arg VITE_SUPABASE_URL="$VITE_SUPABASE_URL" \
  --build-arg VITE_SUPABASE_ANON_KEY="$VITE_SUPABASE_ANON_KEY" \
  -t raitu-mitra-web .
docker run --rm -e PORT=8080 \
  -e SUPABASE_URL="$SUPABASE_URL" \
  -e SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
  -e GROQ_API_KEY="$GROQ_API_KEY" \
  -e CASHFREE_APP_ID="$CASHFREE_APP_ID" \
  -e CASHFREE_SECRET_KEY="$CASHFREE_SECRET_KEY" \
  -e CASHFREE_ENV="$CASHFREE_ENV" \
  -p 8080:8080 raitu-mitra-web
```

Open http://localhost:8080 — `GET /api/health` should return `{"ok":true}`.

## API routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/ai-chatbot` | Groq-powered chatbot |
| POST | `/api/create-cashfree-order` | Create Cashfree order |
| POST | `/api/verify-payment` | Verify Cashfree payment |
| POST | `/api/search-expand` | AI search synonym expansion |
