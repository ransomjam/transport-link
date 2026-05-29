import { prisma } from "./prisma.js";

export async function generateTrackingId(client = prisma) {
  const year = new Date().getFullYear();
  const prefix = `THX-${year}-`;
  const latest = await client.shipment.findFirst({
    where: {
      trackingId: {
        startsWith: prefix
      }
    },
    orderBy: {
      trackingId: "desc"
    },
    select: {
      trackingId: true
    }
  });

  const latestNumber = latest?.trackingId
    ? Number.parseInt(latest.trackingId.replace(prefix, ""), 10)
    : 0;

  let nextNumber = Number.isFinite(latestNumber) ? latestNumber + 1 : 1;

  while (true) {
    const trackingId = `${prefix}${String(nextNumber).padStart(4, "0")}`;
    const existing = await client.shipment.findUnique({
      where: { trackingId },
      select: { id: true }
    });

    if (!existing) {
      return trackingId;
    }

    nextNumber += 1;
  }
}
