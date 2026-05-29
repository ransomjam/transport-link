ALTER TABLE "shipments"
  ADD COLUMN "route_geometry" JSONB,
  ADD COLUMN "route_distance_m" DOUBLE PRECISION,
  ADD COLUMN "route_duration_s" DOUBLE PRECISION,
  ADD COLUMN "route_provider" TEXT,
  ADD COLUMN "clock_offset_minutes" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "auto_progress" BOOLEAN NOT NULL DEFAULT true;
