# Goods Tracking Platform

Admin-controlled goods and shipment tracking website foundation. This first version is designed for estimated shipment progress, route visuals, and admin timeline updates, not live GPS tracking.

## Phase 1 Scope

- Next.js frontend app in `apps/web`
- Express backend API in `apps/api`
- PostgreSQL schema managed with Prisma
- Environment variable examples
- Health check API at `GET /api/health`
- Authentication foundation for protected admin routes
- Deployment-ready workspace structure
- Admin login, dashboard, shipment creation, shipment list/search, detail, and status updates
- Public tracking search and tracking result pages
- Estimated delivery progress, public timeline, and estimated route visual

## Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

   On Windows PowerShell, use `npm.cmd install` if script execution policy blocks `npm`.

2. Copy environment files:

   ```bash
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env.local
   ```

3. Start PostgreSQL:

   ```bash
   docker compose up -d postgres
   ```

   Docker maps PostgreSQL to host port `55633` to avoid conflicts with any PostgreSQL service already using `5432`.

   If Docker is not running but local PostgreSQL binaries are installed, this project can also use the workspace-local dev cluster on port `55432`:

   ```bash
   "C:\Program Files\PostgreSQL\17\bin\pg_ctl.exe" -D .pgdata -o "-p 55432" -l .pgdata\server.log start
   ```

4. Generate the Prisma client and create the database tables:

   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

   Use `npm run prisma:migrate:dev` only when creating or editing migrations
   during local development. Deployment uses `prisma migrate deploy`.

5. Seed the super admin and sample shipments:

   ```bash
   npm run prisma:seed
   ```

6. Run both apps:

   ```bash
   npm run dev
   ```

## Local URLs

- Frontend: `http://localhost:3000`
- Backend health check: `http://localhost:4000/api/health`
- Admin login: `http://localhost:3000/admin/login`
- Sample public tracking: `http://localhost:3000/track/THX-2026-0001`

If Next.js starts on `http://localhost:3001` because port `3000` is already busy, the API also allows that origin in development.

## Seeded Admin

- Email: `admin@goodstracking.local`
- Password: `AdminPass123!`

Change these values before using any shared or deployed environment.

## Free Deployment: Render + Supabase

This app is ready for:

- Frontend: Render Web Service
- Backend: Render Web Service
- Database: Supabase Free PostgreSQL

The frontend is not configured as a Render Static Site because public tracking
uses dynamic URLs like `/track/THX-2026-0001`; forcing Next.js static export
would break arbitrary tracking links.

### 1. Push to GitHub

Push this repository to GitHub so Render can connect to it.

### 2. Create Supabase Database

Create a Supabase project, open the project database connection settings, and
copy the PostgreSQL connection string. Use it as `DATABASE_URL`.

### 3. Deploy Backend on Render

Create a Render **Web Service**.

- Root Directory: `apps/api`
- Build Command: `npm install && npx prisma generate && npx prisma migrate deploy`
- Start Command: `npm start`

Backend environment variables:

```bash
DATABASE_URL=your-supabase-postgresql-connection-string
JWT_SECRET=replace-with-a-long-random-secret
FRONTEND_URL=https://your-frontend-service.onrender.com
NODE_ENV=production
PORT=4000
```

Render provides `PORT` at runtime; the API listens on `process.env.PORT`.

Health check after deploy:

```text
https://your-backend-service.onrender.com/api/health
```

### 4. Deploy Frontend on Render

Create a second Render **Web Service**.

- Root Directory: `apps/web`
- Build Command: `npm install && npm run build`
- Start Command: `npm start`

Frontend environment variable:

```bash
NEXT_PUBLIC_API_URL=https://your-backend-service.onrender.com
```

After the frontend URL is assigned, update the backend `FRONTEND_URL` value to
that exact Render URL so CORS allows admin login, shipment creation, public
tracking, and receipt download.

### 5. Optional Seed

Run seed only when you intentionally want to create a starter admin:

```bash
npm run prisma:seed
```

To apply production migrations and seed/reset the admin in one Render job,
use:

```bash
npm run prisma:setup
```

For production, the seed script does not overwrite an existing admin password
unless `SEED_ADMIN_RESET_PASSWORD=true` is set. It skips sample tracking
records unless `SEED_SAMPLE_DATA=true` is set.

Optional seed variables:

```bash
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=replace-with-a-strong-password
SEED_ADMIN_RESET_PASSWORD=true
SEED_SAMPLE_DATA=true
```

### 6. Final Deployment Checks

Test these URLs after Render finishes deploying:

- Backend health: `https://your-backend-service.onrender.com/api/health`
- Frontend: `https://your-frontend-service.onrender.com`
- Admin login: `https://your-frontend-service.onrender.com/admin/login`
- Public tracking: `https://your-frontend-service.onrender.com/track/THX-2026-0001`
- Receipt download: `https://your-backend-service.onrender.com/api/track/THX-2026-0001/receipt`

## API Endpoints

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/shipments`
- `GET /api/shipments`
- `GET /api/shipments/:id`
- `PUT /api/shipments/:id`
- `POST /api/shipments/:id/history`
- `POST /api/shipments/:id/movement`
- `GET /api/track/:trackingId`
- `GET /api/dashboard/stats`

## Route & Movement Model

Shipment position is **estimated from time along a fixed road route**, not live GPS.

- When a shipment is created or its origin/destination changes, the API builds a
  road route between the two endpoints (via `OSRM_URL`) and caches the polyline
  on the shipment (`route_geometry`). If the routing server is unreachable, it
  falls back to a direct geodesic line, so the feature never breaks.
- Endpoint coordinates are taken from the admin-entered lat/lng, or resolved
  from the place names via a built-in gazetteer when left blank.
- The package's current position is interpolated along that route by elapsed
  time between the departure and expected-delivery dates. It is computed on read
  (no background job) and animated smoothly on the public map. Because the
  marker rides the cached route, it always stays on real roads and never detours
  through an off-corridor "current location".
- Admins control the timeline from the shipment detail page **Movement Control**
  panel (also `POST /api/shipments/:id/movement`):
  - `advanceHours` (positive or negative) nudges the package forward/back in time.
  - `reset` returns it to real time and re-enables auto-advance.
  - `autoProgress: false` pauses movement and pins the package to the manual
    Current Location coordinates; `true` resumes time-based movement.
  - `markDelivered` jumps it to the destination and marks it delivered.

## Notes

- Public tracking pages must use labels like "Estimated Route", "Last Updated Location", and "Estimated Delivery Progress".
- Do not label shipment movement as "live location" unless real GPS tracking is added later.
- Admin-only notes are modeled separately and should not be exposed through public tracking endpoints.
- Public tracking responses only include public shipment fields and public history entries.
