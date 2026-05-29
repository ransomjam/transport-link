-- Supabase production setup for the Goods Tracking API.
-- Safe to paste into the Supabase SQL Editor.
-- No DROP statements are included.
--
-- Before running, replace the admin password placeholder near the bottom:
--   [put my password here]

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserRole') THEN
    CREATE TYPE "UserRole" AS ENUM ('admin', 'super_admin');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ShipmentStatus') THEN
    CREATE TYPE "ShipmentStatus" AS ENUM (
      'SHIPMENT_CREATED',
      'PICKED_UP',
      'IN_TRANSIT',
      'AT_SORTING_FACILITY',
      'ARRIVED_AT_DESTINATION_CITY',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'DELAYED',
      'ON_HOLD',
      'CANCELLED'
    );
  END IF;
END
$$;

ALTER TYPE "ShipmentStatus" ADD VALUE IF NOT EXISTS 'ON_HOLD';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'HistoryVisibility') THEN
    CREATE TYPE "HistoryVisibility" AS ENUM ('public', 'internal');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CheckpointStatus') THEN
    CREATE TYPE "CheckpointStatus" AS ENUM ('pending', 'reached', 'skipped');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS "users" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "password_hash" TEXT NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'admin',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "shipments" (
  "id" TEXT NOT NULL,
  "tracking_id" TEXT NOT NULL,
  "sender_name" TEXT NOT NULL,
  "sender_phone" TEXT,
  "sender_email" TEXT,
  "sender_address" TEXT,
  "receiver_name" TEXT NOT NULL,
  "receiver_phone" TEXT,
  "receiver_email" TEXT,
  "receiver_address" TEXT,
  "origin" TEXT NOT NULL,
  "destination" TEXT NOT NULL,
  "current_location" TEXT,
  "current_status" "ShipmentStatus" NOT NULL DEFAULT 'SHIPMENT_CREATED',
  "shipment_type" TEXT,
  "package_description" TEXT,
  "carrier" TEXT,
  "shipment_mode" TEXT,
  "weight" TEXT,
  "quantity" INTEGER,
  "payment_mode" TEXT,
  "total_freight" TEXT,
  "pickup_date" TIMESTAMP(3),
  "pickup_time" TEXT,
  "departure_date" TIMESTAMP(3) NOT NULL,
  "departure_time" TEXT,
  "estimated_delivery_date" TIMESTAMP(3) NOT NULL,
  "actual_delivery_date" TIMESTAMP(3),
  "progress_percentage" INTEGER NOT NULL DEFAULT 0,
  "public_note" TEXT,
  "comments" TEXT,
  "admin_note" TEXT,
  "origin_lat" DOUBLE PRECISION,
  "origin_lng" DOUBLE PRECISION,
  "destination_lat" DOUBLE PRECISION,
  "destination_lng" DOUBLE PRECISION,
  "current_location_lat" DOUBLE PRECISION,
  "current_location_lng" DOUBLE PRECISION,
  "route_geometry" JSONB,
  "route_distance_m" DOUBLE PRECISION,
  "route_duration_s" DOUBLE PRECISION,
  "route_provider" TEXT,
  "clock_offset_minutes" INTEGER NOT NULL DEFAULT 0,
  "auto_progress" BOOLEAN NOT NULL DEFAULT true,
  "created_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "shipments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "shipment_packages" (
  "id" TEXT NOT NULL,
  "shipment_id" TEXT NOT NULL,
  "qty" INTEGER,
  "pieces" INTEGER,
  "description" TEXT,
  "length_cm" DOUBLE PRECISION,
  "width_cm" DOUBLE PRECISION,
  "height_cm" DOUBLE PRECISION,
  "weight_kg" DOUBLE PRECISION,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "shipment_packages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "shipment_history" (
  "id" TEXT NOT NULL,
  "shipment_id" TEXT NOT NULL,
  "status" "ShipmentStatus" NOT NULL,
  "location" TEXT,
  "note" TEXT,
  "visibility" "HistoryVisibility" NOT NULL DEFAULT 'public',
  "updated_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "shipment_history_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "route_checkpoints" (
  "id" TEXT NOT NULL,
  "shipment_id" TEXT NOT NULL,
  "checkpoint_name" TEXT NOT NULL,
  "location" TEXT NOT NULL,
  "expected_time" TIMESTAMP(3),
  "actual_time" TIMESTAMP(3),
  "status" "CheckpointStatus" NOT NULL DEFAULT 'pending',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "route_checkpoints_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "contact_messages" (
  "id" TEXT NOT NULL,
  "first_name" TEXT NOT NULL,
  "last_name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "service" TEXT,
  "message" TEXT NOT NULL,
  "is_read" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "shipments_tracking_id_key" ON "shipments"("tracking_id");
CREATE INDEX IF NOT EXISTS "shipments_tracking_id_idx" ON "shipments"("tracking_id");
CREATE INDEX IF NOT EXISTS "shipments_current_status_idx" ON "shipments"("current_status");
CREATE INDEX IF NOT EXISTS "shipment_packages_shipment_id_idx" ON "shipment_packages"("shipment_id");
CREATE INDEX IF NOT EXISTS "shipment_history_shipment_id_idx" ON "shipment_history"("shipment_id");
CREATE INDEX IF NOT EXISTS "shipment_history_visibility_idx" ON "shipment_history"("visibility");
CREATE INDEX IF NOT EXISTS "route_checkpoints_shipment_id_idx" ON "route_checkpoints"("shipment_id");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'shipments_created_by_fkey') THEN
    ALTER TABLE "shipments"
      ADD CONSTRAINT "shipments_created_by_fkey"
      FOREIGN KEY ("created_by") REFERENCES "users"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'shipment_packages_shipment_id_fkey') THEN
    ALTER TABLE "shipment_packages"
      ADD CONSTRAINT "shipment_packages_shipment_id_fkey"
      FOREIGN KEY ("shipment_id") REFERENCES "shipments"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'shipment_history_shipment_id_fkey') THEN
    ALTER TABLE "shipment_history"
      ADD CONSTRAINT "shipment_history_shipment_id_fkey"
      FOREIGN KEY ("shipment_id") REFERENCES "shipments"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'shipment_history_updated_by_fkey') THEN
    ALTER TABLE "shipment_history"
      ADD CONSTRAINT "shipment_history_updated_by_fkey"
      FOREIGN KEY ("updated_by") REFERENCES "users"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'route_checkpoints_shipment_id_fkey') THEN
    ALTER TABLE "route_checkpoints"
      ADD CONSTRAINT "route_checkpoints_shipment_id_fkey"
      FOREIGN KEY ("shipment_id") REFERENCES "shipments"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

INSERT INTO "users" (
  "id",
  "name",
  "email",
  "password_hash",
  "role",
  "created_at",
  "updated_at"
) VALUES (
  'setup_admin_transport_link',
  'Super Admin',
  'admin@transport-link.com',
  crypt('AdminPass123!', gen_salt('bf', 12)),
  'super_admin',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("email") DO UPDATE SET
  "name" = EXCLUDED."name",
  "password_hash" = EXCLUDED."password_hash",
  "role" = EXCLUDED."role",
  "updated_at" = CURRENT_TIMESTAMP;
