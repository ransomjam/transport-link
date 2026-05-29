import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAdmin } from "../middleware/auth.js";

export const adminRouter = Router();

adminRouter.get("/dashboard/stats", requireAdmin, async (_req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalShipments, todayNewShipments, grouped] = await Promise.all([
      prisma.shipment.count(),
      prisma.shipment.count({
        where: {
          createdAt: {
            gte: today
          }
        }
      }),
      prisma.shipment.groupBy({
        by: ["currentStatus"],
        _count: {
          currentStatus: true
        }
      })
    ]);

    const byStatus = Object.fromEntries(
      grouped.map((entry) => [entry.currentStatus, entry._count.currentStatus])
    );

    res.json({
      totalShipments,
      inTransit: byStatus.IN_TRANSIT ?? 0,
      delivered: byStatus.DELIVERED ?? 0,
      delayed: byStatus.DELAYED ?? 0,
      onHold: byStatus.ON_HOLD ?? 0,
      cancelled: byStatus.CANCELLED ?? 0,
      todayNewShipments,
      byStatus
    });
  } catch (error) {
    next(error);
  }
});
