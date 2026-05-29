import { Router } from "express";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { auditEvent } from "../middleware/audit.js";
import { requireAdmin } from "../middleware/auth.js";
import { calculateShipmentProgress } from "../lib/progress.js";
import { buildMovementPayload, movementFraction } from "../lib/movement.js";
import { buildRoute, resolveEndpoint, routeNeedsRebuild } from "../lib/route.js";
import { prisma } from "../lib/prisma.js";
import { getStatusLabel, normalizeStatus, shipmentStatuses } from "../lib/status.js";
import { generateTrackingId } from "../lib/tracking-id.js";

export const shipmentsRouter = Router();

const nullableBool = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }
  if (typeof value === "string") {
    return value === "true" || value === "1" || value === "on";
  }
  return Boolean(value);
}, z.boolean().optional());

// Resolve endpoints from coordinates (or gazetteer) and build the cached road
// route between them. Returns the columns to persist on the shipment.
async function computeRouteFields(shipment) {
  const start = resolveEndpoint(shipment.originLat, shipment.originLng, shipment.origin);
  const end = resolveEndpoint(shipment.destinationLat, shipment.destinationLng, shipment.destination);
  const route = await buildRoute(start, end);

  return {
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

const nullableText = z.preprocess((value) => {
  if (value === "" || value === null) {
    return null;
  }

  return typeof value === "string" ? value.trim() : value;
}, z.string().min(1).nullable().optional());

const nullableEmail = z.preprocess((value) => {
  if (value === "" || value === null) {
    return null;
  }

  return typeof value === "string" ? value.trim() : value;
}, z.string().email().nullable().optional());

const nullableDate = z.preprocess((value) => {
  if (value === "" || value === null) {
    return null;
  }

  return value;
}, z.coerce.date().nullable().optional());

const optionalDate = z.preprocess((value) => {
  if (value === "" || value === null) {
    return undefined;
  }

  return value;
}, z.coerce.date().optional());

const nullableInt = z.preprocess((value) => {
  if (value === undefined) {
    return undefined;
  }

  if (value === "" || value === null) {
    return null;
  }

  return Number(value);
}, z.number().int().nullable().optional());

const nullableFloat = z.preprocess((value) => {
  if (value === undefined) {
    return undefined;
  }

  if (value === "" || value === null) {
    return null;
  }

  return Number(value);
}, z.number().nullable().optional());

const trackingIdInput = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  return String(value).trim().toUpperCase();
}, z.string().regex(/^[A-Z0-9][A-Z0-9-]{4,40}$/).optional());

const statusSchema = z.preprocess(normalizeStatus, z.enum(shipmentStatuses));

const packageSchema = z.object({
  qty: nullableInt,
  pieces: nullableInt,
  description: nullableText,
  lengthCm: nullableFloat,
  widthCm: nullableFloat,
  heightCm: nullableFloat,
  weightKg: nullableFloat
});

const packagesSchema = z.preprocess((value) => {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  }

  return value;
}, z.array(packageSchema).optional());

const createShipmentSchema = z.object({
  trackingId: trackingIdInput,
  senderName: z.string().trim().min(1),
  senderPhone: nullableText,
  senderEmail: nullableEmail,
  senderAddress: nullableText,
  receiverName: z.string().trim().min(1),
  receiverPhone: nullableText,
  receiverEmail: nullableEmail,
  receiverAddress: nullableText,
  origin: z.string().trim().min(1),
  destination: z.string().trim().min(1),
  currentLocation: nullableText,
  currentStatus: statusSchema.default("SHIPMENT_CREATED"),
  shipmentType: nullableText,
  packageDescription: nullableText,
  carrier: nullableText,
  shipmentMode: nullableText,
  weight: nullableText,
  quantity: nullableInt,
  paymentMode: nullableText,
  totalFreight: nullableText,
  pickupDate: nullableDate,
  pickupTime: nullableText,
  departureDate: optionalDate,
  departureTime: nullableText,
  estimatedDeliveryDate: z.coerce.date(),
  actualDeliveryDate: nullableDate,
  publicNote: nullableText,
  comments: nullableText,
  adminNote: nullableText,
  originLat: nullableFloat,
  originLng: nullableFloat,
  destinationLat: nullableFloat,
  destinationLng: nullableFloat,
  currentLocationLat: nullableFloat,
  currentLocationLng: nullableFloat,
  autoProgress: nullableBool,
  packages: packagesSchema.default([])
});

const updateShipmentSchema = z.object({
  trackingId: trackingIdInput,
  senderName: z.string().trim().min(1).optional(),
  senderPhone: nullableText,
  senderEmail: nullableEmail,
  senderAddress: nullableText,
  receiverName: z.string().trim().min(1).optional(),
  receiverPhone: nullableText,
  receiverEmail: nullableEmail,
  receiverAddress: nullableText,
  origin: z.string().trim().min(1).optional(),
  destination: z.string().trim().min(1).optional(),
  currentLocation: nullableText,
  currentStatus: statusSchema.optional(),
  shipmentType: nullableText,
  packageDescription: nullableText,
  carrier: nullableText,
  shipmentMode: nullableText,
  weight: nullableText,
  quantity: nullableInt,
  paymentMode: nullableText,
  totalFreight: nullableText,
  pickupDate: nullableDate,
  pickupTime: nullableText,
  departureDate: optionalDate,
  departureTime: nullableText,
  estimatedDeliveryDate: optionalDate,
  actualDeliveryDate: nullableDate,
  publicNote: nullableText,
  comments: nullableText,
  adminNote: nullableText,
  originLat: nullableFloat,
  originLng: nullableFloat,
  destinationLat: nullableFloat,
  destinationLng: nullableFloat,
  currentLocationLat: nullableFloat,
  currentLocationLng: nullableFloat,
  autoProgress: nullableBool,
  packages: packagesSchema
});

const movementSchema = z.object({
  advanceHours: z.coerce.number().finite().optional(),
  setClockOffsetMinutes: z.coerce.number().int().optional(),
  reset: nullableBool,
  autoProgress: nullableBool,
  markDelivered: nullableBool
});

const historySchema = z.object({
  status: statusSchema,
  location: nullableText,
  note: nullableText,
  visibility: z.enum(["public", "internal"]).default("public")
});

const shipmentInclude = {
  packages: {
    orderBy: { createdAt: "asc" }
  }
};

function duplicateTrackingId(error) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function formatShipment(shipment) {
  return {
    ...shipment,
    statusLabel: getStatusLabel(shipment.currentStatus),
    movement: buildMovementPayload(shipment)
  };
}

function compactData(input, omit = []) {
  const skipped = new Set(omit);

  return Object.fromEntries(Object.entries(input).filter(([key, value]) => !skipped.has(key) && value !== undefined));
}

function normalizePackages(packages = []) {
  return packages
    .map((item) => ({
      qty: item.qty ?? null,
      pieces: item.pieces ?? null,
      description: item.description ?? null,
      lengthCm: item.lengthCm ?? null,
      widthCm: item.widthCm ?? null,
      heightCm: item.heightCm ?? null,
      weightKg: item.weightKg ?? null
    }))
    .filter((item) => Object.values(item).some((value) => value !== null && value !== ""));
}

shipmentsRouter.post("/shipments", requireAdmin, auditEvent("shipment.create"), async (req, res, next) => {
  try {
    const input = createShipmentSchema.parse(req.body);
    const trackingId = input.trackingId ?? (await generateTrackingId());
    const currentLocation = input.currentLocation ?? input.origin;
    const currentStatus = input.currentStatus;
    const departureDate = input.departureDate ?? input.pickupDate ?? new Date();
    const progressPercentage = calculateShipmentProgress({
      ...input,
      trackingId,
      currentLocation,
      currentStatus,
      departureDate,
      progressPercentage: 0
    });
    const packages = normalizePackages(input.packages);
    const routeFields = await computeRouteFields({
      origin: input.origin,
      destination: input.destination,
      originLat: input.originLat,
      originLng: input.originLng,
      destinationLat: input.destinationLat,
      destinationLng: input.destinationLng
    });

    const shipment = await prisma.$transaction(async (tx) => {
      const created = await tx.shipment.create({
        data: {
          ...compactData(input, ["packages"]),
          trackingId,
          currentLocation,
          currentStatus,
          departureDate,
          progressPercentage,
          ...routeFields,
          createdById: req.user.sub,
          ...(packages.length ? { packages: { create: packages } } : {})
        },
        include: shipmentInclude
      });

      await tx.shipmentHistory.create({
        data: {
          shipmentId: created.id,
          status: currentStatus,
          location: currentLocation,
          note: input.publicNote ?? input.comments ?? "Shipment has been registered.",
          visibility: "public",
          updatedById: req.user.sub
        }
      });

      return created;
    });

    return res.status(201).json({ shipment: formatShipment(shipment) });
  } catch (error) {
    if (duplicateTrackingId(error)) {
      return res.status(409).json({ message: "Tracking ID already exists" });
    }

    return next(error);
  }
});

shipmentsRouter.get("/shipments", requireAdmin, async (req, res, next) => {
  try {
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const status = req.query.status ? normalizeStatus(req.query.status) : undefined;
    const from = req.query.from ? new Date(String(req.query.from)) : undefined;
    const to = req.query.to ? new Date(String(req.query.to)) : undefined;

    const where = {
      ...(search
        ? {
            OR: [
              { trackingId: { contains: search, mode: "insensitive" } },
              { senderName: { contains: search, mode: "insensitive" } },
              { receiverName: { contains: search, mode: "insensitive" } }
            ]
          }
        : {}),
      ...(shipmentStatuses.includes(status) ? { currentStatus: status } : {}),
      ...(from || to
        ? {
            createdAt: {
              ...(from && Number.isFinite(from.getTime()) ? { gte: from } : {}),
              ...(to && Number.isFinite(to.getTime()) ? { lte: to } : {})
            }
          }
        : {})
    };

    const shipments = await prisma.shipment.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        _count: {
          select: { history: true }
        }
      }
    });

    return res.json({ shipments: shipments.map(formatShipment) });
  } catch (error) {
    return next(error);
  }
});

shipmentsRouter.get("/shipments/:id", requireAdmin, async (req, res, next) => {
  try {
    const shipment = await prisma.shipment.findUnique({
      where: { id: req.params.id },
      include: {
        ...shipmentInclude,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        history: {
          orderBy: { createdAt: "desc" },
          include: {
            updatedBy: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        routeCheckpoints: {
          orderBy: { expectedTime: "asc" }
        }
      }
    });

    if (!shipment) {
      return res.status(404).json({ message: "Shipment not found" });
    }

    return res.json({ shipment: formatShipment(shipment) });
  } catch (error) {
    return next(error);
  }
});

shipmentsRouter.put("/shipments/:id", requireAdmin, auditEvent("shipment.update"), async (req, res, next) => {
  try {
    const input = updateShipmentSchema.parse(req.body);
    const existing = await prisma.shipment.findUnique({
      where: { id: req.params.id }
    });

    if (!existing) {
      return res.status(404).json({ message: "Shipment not found" });
    }

    const data = compactData(input, ["packages"]);
    const nextShipment = {
      ...existing,
      ...data,
      currentStatus: data.currentStatus ?? existing.currentStatus,
      currentLocation: data.currentLocation ?? existing.currentLocation
    };

    const progressPercentage = calculateShipmentProgress(nextShipment);
    const actualDeliveryDate =
      nextShipment.currentStatus === "DELIVERED"
        ? data.actualDeliveryDate ?? existing.actualDeliveryDate ?? new Date()
        : data.actualDeliveryDate === undefined
          ? existing.actualDeliveryDate
          : data.actualDeliveryDate;
    const statusChanged = data.currentStatus !== undefined && data.currentStatus !== existing.currentStatus;
    const locationChanged = data.currentLocation !== undefined && data.currentLocation !== existing.currentLocation;
    const packages = input.packages === undefined ? undefined : normalizePackages(input.packages);

    // Recompute the cached road route when an endpoint moved (or it is missing).
    const routeFields = routeNeedsRebuild(existing, nextShipment) ? await computeRouteFields(nextShipment) : null;

    const shipment = await prisma.$transaction(async (tx) => {
      const updated = await tx.shipment.update({
        where: { id: existing.id },
        data: {
          ...data,
          actualDeliveryDate,
          progressPercentage,
          ...(routeFields ?? {})
        }
      });

      if (packages) {
        await tx.shipmentPackage.deleteMany({
          where: { shipmentId: existing.id }
        });

        if (packages.length) {
          await tx.shipmentPackage.createMany({
            data: packages.map((item) => ({
              ...item,
              shipmentId: existing.id
            }))
          });
        }
      }

      if (statusChanged || locationChanged) {
        await tx.shipmentHistory.create({
          data: {
            shipmentId: updated.id,
            status: updated.currentStatus,
            location: updated.currentLocation,
            note: data.publicNote ?? data.comments ?? `Shipment status updated to ${getStatusLabel(updated.currentStatus)}.`,
            visibility: "public",
            updatedById: req.user.sub
          }
        });
      }

      return tx.shipment.findUnique({
        where: { id: existing.id },
        include: shipmentInclude
      });
    });

    return res.json({ shipment: formatShipment(shipment) });
  } catch (error) {
    if (duplicateTrackingId(error)) {
      return res.status(409).json({ message: "Tracking ID already exists" });
    }

    return next(error);
  }
});

shipmentsRouter.post("/shipments/:id/history", requireAdmin, auditEvent("shipment.history.create"), async (req, res, next) => {
  try {
    const input = historySchema.parse(req.body);
    const existing = await prisma.shipment.findUnique({
      where: { id: req.params.id }
    });

    if (!existing) {
      return res.status(404).json({ message: "Shipment not found" });
    }

    const progressPercentage = calculateShipmentProgress({
      ...existing,
      currentStatus: input.status
    });

    const result = await prisma.$transaction(async (tx) => {
      const history = await tx.shipmentHistory.create({
        data: {
          shipmentId: existing.id,
          status: input.status,
          location: input.location ?? existing.currentLocation,
          note: input.note,
          visibility: input.visibility,
          updatedById: req.user.sub
        }
      });

      const shipment = await tx.shipment.update({
        where: { id: existing.id },
        data: {
          currentStatus: input.status,
          currentLocation: input.location ?? existing.currentLocation,
          progressPercentage,
          ...(input.status === "DELIVERED" ? { actualDeliveryDate: new Date() } : {}),
          ...(input.visibility === "public" ? { publicNote: input.note } : { adminNote: input.note })
        }
      });

      return { history, shipment };
    });

    return res.status(201).json({
      history: result.history,
      shipment: formatShipment(result.shipment)
    });
  } catch (error) {
    return next(error);
  }
});

// Admin movement control: nudge the timeline forward/back, pause/resume the
// auto-advance, reset to real time, or jump straight to delivered.
shipmentsRouter.post("/shipments/:id/movement", requireAdmin, auditEvent("shipment.movement"), async (req, res, next) => {
  try {
    const input = movementSchema.parse(req.body);
    const existing = await prisma.shipment.findUnique({
      where: { id: req.params.id }
    });

    if (!existing) {
      return res.status(404).json({ message: "Shipment not found" });
    }

    let clockOffsetMinutes = existing.clockOffsetMinutes ?? 0;
    let autoProgress = existing.autoProgress !== false;
    let currentStatus = existing.currentStatus;

    if (input.reset) {
      clockOffsetMinutes = 0;
      autoProgress = true;
    }
    if (input.setClockOffsetMinutes !== undefined) {
      clockOffsetMinutes = input.setClockOffsetMinutes;
    }
    if (input.advanceHours !== undefined) {
      clockOffsetMinutes += Math.round(input.advanceHours * 60);
    }
    if (input.markDelivered) {
      currentStatus = "DELIVERED";
      autoProgress = false;
    }
    if (input.autoProgress !== undefined) {
      autoProgress = input.autoProgress;
    }

    // Freeze the live fraction at its current value when pausing auto-advance,
    // so a paused shipment stays where it visually is.
    const liveFraction = movementFraction(
      { ...existing, clockOffsetMinutes, autoProgress: true, currentStatus },
      Date.now()
    );
    const frozenProgress = Math.max(0, Math.min(99, Math.round(liveFraction * 100)));

    const nextStatus = { ...existing, currentStatus, clockOffsetMinutes, autoProgress };
    const progressPercentage = currentStatus === "DELIVERED" ? 100 : autoProgress ? calculateShipmentProgress(nextStatus) : frozenProgress;

    const shipment = await prisma.shipment.update({
      where: { id: existing.id },
      data: {
        clockOffsetMinutes,
        autoProgress,
        currentStatus,
        progressPercentage,
        ...(currentStatus === "DELIVERED"
          ? { actualDeliveryDate: existing.actualDeliveryDate ?? new Date() }
          : {})
      },
      include: shipmentInclude
    });

    return res.json({ shipment: formatShipment(shipment) });
  } catch (error) {
    return next(error);
  }
});
