import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { buildRoute, resolveEndpoint } from "../src/lib/route.js";

const prisma = new PrismaClient();

const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@goodstracking.local";
const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "AdminPass123!";

// Resolve endpoints and build the cached road route, mirroring the API so
// seeded shipments behave exactly like admin-created ones.
async function withRoute(shipment) {
  const start = resolveEndpoint(shipment.originLat, shipment.originLng, shipment.origin);
  const end = resolveEndpoint(shipment.destinationLat, shipment.destinationLng, shipment.destination);
  const route = await buildRoute(start, end);

  return {
    ...shipment,
    originLat: shipment.originLat ?? start?.lat ?? null,
    originLng: shipment.originLng ?? start?.lng ?? null,
    destinationLat: shipment.destinationLat ?? end?.lat ?? null,
    destinationLng: shipment.destinationLng ?? end?.lng ?? null,
    routeGeometry: route?.geometry ?? null,
    routeDistanceM: route?.distanceM ?? null,
    routeDurationS: route?.durationS ?? null,
    routeProvider: route?.provider ?? null
  };
}

async function upsertShipment(admin, rawShipment, history, packages = []) {
  const shipment = await withRoute(rawShipment);
  const record = await prisma.shipment.upsert({
    where: { trackingId: shipment.trackingId },
    update: {
      ...shipment,
      createdById: admin.id
    },
    create: {
      ...shipment,
      createdById: admin.id
    }
  });

  await prisma.shipmentHistory.deleteMany({
    where: { shipmentId: record.id }
  });

  await prisma.shipmentHistory.createMany({
    data: history.map((entry) => ({
      ...entry,
      shipmentId: record.id,
      updatedById: admin.id
    }))
  });

  await prisma.shipmentPackage.deleteMany({
    where: { shipmentId: record.id }
  });

  if (packages.length) {
    await prisma.shipmentPackage.createMany({
      data: packages.map((entry) => ({
        ...entry,
        shipmentId: record.id
      }))
    });
  }
}

const HOUR = 60 * 60 * 1000;

async function main() {
  const passwordHash = await bcrypt.hash(adminPassword, 12);
  // Anchor the demo shipment around "now" so it is visibly mid-route.
  const now = Date.now();
  const demoDeparture = new Date(now - 18 * HOUR);
  const demoPickup = new Date(now - 20 * HOUR);
  const demoEta = new Date(now + 30 * HOUR);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: "Super Admin",
      passwordHash,
      role: "super_admin"
    },
    create: {
      name: "Super Admin",
      email: adminEmail,
      passwordHash,
      role: "super_admin"
    }
  });

  await upsertShipment(
    admin,
    {
      trackingId: "THX-2026-0001",
      senderName: "Riggs Vintage Mazda",
      senderPhone: "+1 780 555 0198",
      senderEmail: "shipping@riggsvintagemazda.test",
      senderAddress: "Edmonton, Canada",
      receiverName: "Dylan Stough",
      receiverPhone: "+1 405 555 0110",
      receiverEmail: "dylan.stough@example.test",
      receiverAddress: "609 General Senter Drive, Midwest City, Oklahoma 73110",
      origin: "Garden City, KS",
      destination: "Midwest City, Oklahoma",
      currentLocation: null,
      originLat: 37.9717,
      originLng: -100.8727,
      destinationLat: 35.4495,
      destinationLng: -97.3967,
      currentLocationLat: null,
      currentLocationLng: null,
      autoProgress: true,
      clockOffsetMinutes: 0,
      currentStatus: "IN_TRANSIT",
      shipmentType: "Cargo",
      packageDescription: "Mazda RX7 FB wing and rear axle",
      carrier: "DHL",
      shipmentMode: "Ground Freight",
      weight: "65kg",
      quantity: 2,
      paymentMode: "Zelle",
      totalFreight: "1",
      pickupDate: demoPickup,
      pickupTime: "10:15",
      departureDate: demoDeparture,
      departureTime: "13:15",
      estimatedDeliveryDate: demoEta,
      progressPercentage: 38,
      publicNote: "Your package is in transit toward the destination.",
      comments: "Your package is in transit toward the destination.",
      adminNote: "Auto-advancing along the road route between origin and destination."
    },
    [
      {
        status: "PICKED_UP",
        location: "Garden City, KS",
        note: "Shipment has been picked up and departed origin.",
        visibility: "public",
        createdAt: demoDeparture
      },
      {
        status: "IN_TRANSIT",
        location: "In transit",
        note: "Shipment is in transit to the next sorting point.",
        visibility: "public",
        createdAt: new Date(now - 6 * HOUR)
      }
    ],
    [
      {
        qty: 2,
        pieces: 2,
        description: "Mazda RX7 FB wing and rear axle",
        lengthCm: 180,
        widthCm: 62,
        heightCm: 45,
        weightKg: 65
      }
    ]
  );

  await upsertShipment(
    admin,
    {
      trackingId: "THX-2026-0002",
      senderName: "Lakeview Supplies",
      senderPhone: "+1 312 555 0144",
      senderEmail: "orders@lakeview.test",
      receiverName: "Cedar Clinic",
      receiverPhone: "+1 216 555 0120",
      receiverEmail: "store@cedarclinic.test",
      origin: "Chicago, Illinois",
      destination: "Cleveland, Ohio",
      currentLocation: "Cleveland, Ohio",
      originLat: 41.8781,
      originLng: -87.6298,
      destinationLat: 41.4993,
      destinationLng: -81.6944,
      currentLocationLat: 41.4993,
      currentLocationLng: -81.6944,
      currentStatus: "DELIVERED",
      shipmentType: "Medical supplies",
      departureDate: new Date("2026-05-22T07:30:00.000Z"),
      estimatedDeliveryDate: new Date("2026-05-23T16:00:00.000Z"),
      actualDeliveryDate: new Date("2026-05-23T14:20:00.000Z"),
      progressPercentage: 100,
      publicNote: "Shipment delivered successfully.",
      adminNote: "Delivery completed ahead of estimate."
    },
    [
      {
        status: "SHIPMENT_CREATED",
        location: "Chicago, Illinois",
        note: "Shipment has been registered.",
        visibility: "public",
        createdAt: new Date("2026-05-22T07:30:00.000Z")
      },
      {
        status: "DELIVERED",
        location: "Cleveland, Ohio",
        note: "Shipment delivered successfully.",
        visibility: "public",
        createdAt: new Date("2026-05-23T14:20:00.000Z")
      }
    ]
  );

  console.log(`Seeded super admin: ${adminEmail}`);
  console.log(`Seeded password: ${adminPassword}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
