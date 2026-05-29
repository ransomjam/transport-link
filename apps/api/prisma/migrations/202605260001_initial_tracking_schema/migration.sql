CREATE TYPE "UserRole" AS ENUM ('admin', 'super_admin');

CREATE TYPE "ShipmentStatus" AS ENUM (
  'SHIPMENT_CREATED',
  'PICKED_UP',
  'IN_TRANSIT',
  'AT_SORTING_FACILITY',
  'ARRIVED_AT_DESTINATION_CITY',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'DELAYED',
  'CANCELLED'
);

CREATE TYPE "HistoryVisibility" AS ENUM ('public', 'internal');

CREATE TYPE "CheckpointStatus" AS ENUM ('pending', 'reached', 'skipped');

CREATE TABLE "users" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "password_hash" TEXT NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'admin',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "shipments" (
  "id" TEXT NOT NULL,
  "tracking_id" TEXT NOT NULL,
  "sender_name" TEXT NOT NULL,
  "sender_phone" TEXT,
  "sender_email" TEXT,
  "receiver_name" TEXT NOT NULL,
  "receiver_phone" TEXT,
  "receiver_email" TEXT,
  "origin" TEXT NOT NULL,
  "destination" TEXT NOT NULL,
  "current_location" TEXT,
  "current_status" "ShipmentStatus" NOT NULL DEFAULT 'SHIPMENT_CREATED',
  "shipment_type" TEXT,
  "departure_date" TIMESTAMP(3) NOT NULL,
  "estimated_delivery_date" TIMESTAMP(3) NOT NULL,
  "actual_delivery_date" TIMESTAMP(3),
  "progress_percentage" INTEGER NOT NULL DEFAULT 0,
  "public_note" TEXT,
  "admin_note" TEXT,
  "created_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "shipments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "shipment_history" (
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

CREATE TABLE "route_checkpoints" (
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

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "shipments_tracking_id_key" ON "shipments"("tracking_id");
CREATE INDEX "shipments_tracking_id_idx" ON "shipments"("tracking_id");
CREATE INDEX "shipments_current_status_idx" ON "shipments"("current_status");
CREATE INDEX "shipment_history_shipment_id_idx" ON "shipment_history"("shipment_id");
CREATE INDEX "shipment_history_visibility_idx" ON "shipment_history"("visibility");
CREATE INDEX "route_checkpoints_shipment_id_idx" ON "route_checkpoints"("shipment_id");

ALTER TABLE "shipments"
  ADD CONSTRAINT "shipments_created_by_fkey"
  FOREIGN KEY ("created_by") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "shipment_history"
  ADD CONSTRAINT "shipment_history_shipment_id_fkey"
  FOREIGN KEY ("shipment_id") REFERENCES "shipments"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "shipment_history"
  ADD CONSTRAINT "shipment_history_updated_by_fkey"
  FOREIGN KEY ("updated_by") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "route_checkpoints"
  ADD CONSTRAINT "route_checkpoints_shipment_id_fkey"
  FOREIGN KEY ("shipment_id") REFERENCES "shipments"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
