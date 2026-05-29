ALTER TYPE "ShipmentStatus" ADD VALUE IF NOT EXISTS 'ON_HOLD';

ALTER TABLE "shipments"
  ADD COLUMN "sender_address" TEXT,
  ADD COLUMN "receiver_address" TEXT,
  ADD COLUMN "package_description" TEXT,
  ADD COLUMN "carrier" TEXT,
  ADD COLUMN "shipment_mode" TEXT,
  ADD COLUMN "weight" TEXT,
  ADD COLUMN "quantity" INTEGER,
  ADD COLUMN "payment_mode" TEXT,
  ADD COLUMN "total_freight" TEXT,
  ADD COLUMN "pickup_date" TIMESTAMP(3),
  ADD COLUMN "pickup_time" TEXT,
  ADD COLUMN "departure_time" TEXT,
  ADD COLUMN "comments" TEXT,
  ADD COLUMN "origin_lat" DOUBLE PRECISION,
  ADD COLUMN "origin_lng" DOUBLE PRECISION,
  ADD COLUMN "destination_lat" DOUBLE PRECISION,
  ADD COLUMN "destination_lng" DOUBLE PRECISION,
  ADD COLUMN "current_location_lat" DOUBLE PRECISION,
  ADD COLUMN "current_location_lng" DOUBLE PRECISION;

CREATE TABLE "shipment_packages" (
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

CREATE INDEX "shipment_packages_shipment_id_idx" ON "shipment_packages"("shipment_id");

ALTER TABLE "shipment_packages"
  ADD CONSTRAINT "shipment_packages_shipment_id_fkey"
  FOREIGN KEY ("shipment_id") REFERENCES "shipments"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
