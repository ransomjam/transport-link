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

## API Endpoints

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/shipments`
- `GET /api/shipments`
- `GET /api/shipments/:id`
- `PUT /api/shipments/:id`
- `POST /api/shipments/:id/history`
- `GET /api/track/:trackingId`
- `GET /api/dashboard/stats`

## Notes

- Public tracking pages must use labels like "Estimated Route", "Last Updated Location", and "Estimated Delivery Progress".
- Do not label shipment movement as "live location" unless real GPS tracking is added later.
- Admin-only notes are modeled separately and should not be exposed through public tracking endpoints.
- Public tracking responses only include public shipment fields and public history entries.
