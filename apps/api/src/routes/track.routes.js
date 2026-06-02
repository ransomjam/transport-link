import { Router } from "express";
import PDFDocument from "pdfkit";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { calculateShipmentProgress } from "../lib/progress.js";
import { buildMovementPayload } from "../lib/movement.js";
import { prisma } from "../lib/prisma.js";
import { getStatusLabel } from "../lib/status.js";
import fs from "fs";
import path from "path";

export const trackRouter = Router();

const trackingIdSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9][A-Z0-9-]{4,40}$/);

const publicShipmentInclude = {
  packages: {
    orderBy: { createdAt: "asc" }
  },
  history: {
    where: {
      visibility: "public"
    },
    orderBy: {
      createdAt: "asc"
    },
    select: {
      status: true,
      location: true,
      note: true,
      createdAt: true
    }
  }
};

const trackRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    message: "Too many tracking requests. Please wait a moment and try again."
  }
});

trackRouter.get("/track/:trackingId", trackRateLimiter, async (req, res, next) => {
  try {
    const shipment = await loadPublicShipment(req.params.trackingId);

    if (!shipment) {
      return res.status(404).json({
        message: "No shipment found for this tracking ID. Please check the number and try again."
      });
    }

    return res.json({ shipment: toPublicShipment(shipment) });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    return next(error);
  }
});

trackRouter.get("/track/:trackingId/receipt", trackRateLimiter, async (req, res, next) => {
  try {
    const shipment = await loadPublicShipment(req.params.trackingId);

    if (!shipment) {
      return res.status(404).json({
        message: "No shipment found for this tracking ID. Please check the number and try again."
      });
    }

    const publicShipment = toPublicShipment(shipment);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${publicShipment.trackingId}-receipt.pdf"`);
    renderReceiptPdf(publicShipment, res);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    return next(error);
  }
});

async function loadPublicShipment(trackingId) {
  const parsed = trackingIdSchema.safeParse(trackingId);

  if (!parsed.success) {
    const error = new Error("Please enter a valid tracking ID and try again.");
    error.statusCode = 400;
    throw error;
  }

  return prisma.shipment.findUnique({
    where: {
      trackingId: parsed.data
    },
    include: publicShipmentInclude
  });
}

function toPublicShipment(shipment) {
  const movement = buildMovementPayload(shipment);
  // Public tracking shows the live, route-derived position and label rather
  // than any raw admin-entered coordinate.
  const currentLocation = movement.label ?? shipment.currentLocation;
  const currentLocationLat = movement.lat ?? shipment.currentLocationLat;
  const currentLocationLng = movement.lng ?? shipment.currentLocationLng;

  return {
    trackingId: shipment.trackingId,
    senderName: shipment.senderName,
    senderPhone: shipment.senderPhone,
    senderEmail: shipment.senderEmail,
    senderAddress: shipment.senderAddress,
    receiverName: shipment.receiverName,
    receiverPhone: shipment.receiverPhone,
    receiverEmail: shipment.receiverEmail,
    receiverAddress: shipment.receiverAddress,
    origin: shipment.origin,
    destination: shipment.destination,
    currentLocation,
    currentStatus: shipment.currentStatus,
    statusLabel: getStatusLabel(shipment.currentStatus),
    shipmentType: shipment.shipmentType,
    packageDescription: shipment.packageDescription,
    carrier: shipment.carrier,
    shipmentMode: shipment.shipmentMode,
    weight: shipment.weight,
    quantity: shipment.quantity,
    paymentMode: shipment.paymentMode,
    totalFreight: shipment.totalFreight,
    pickupDate: shipment.pickupDate,
    pickupTime: shipment.pickupTime,
    departureDate: shipment.departureDate,
    departureTime: shipment.departureTime,
    estimatedDeliveryDate: shipment.estimatedDeliveryDate,
    actualDeliveryDate: shipment.actualDeliveryDate,
    progressPercentage: calculateShipmentProgress(shipment),
    publicNote: shipment.publicNote,
    comments: shipment.comments,
    originLat: shipment.originLat,
    originLng: shipment.originLng,
    destinationLat: shipment.destinationLat,
    destinationLng: shipment.destinationLng,
    currentLocationLat,
    currentLocationLng,
    routeGeometry: Array.isArray(shipment.routeGeometry) ? shipment.routeGeometry : null,
    routeDistanceM: shipment.routeDistanceM,
    routeDurationS: shipment.routeDurationS,
    movement,
    updatedAt: shipment.updatedAt,
    packages: shipment.packages.map((item) => ({
      qty: item.qty,
      pieces: item.pieces,
      description: item.description,
      lengthCm: item.lengthCm,
      widthCm: item.widthCm,
      heightCm: item.heightCm,
      weightKg: item.weightKg
    })),
    history: shipment.history.map((entry) => ({
      status: entry.status,
      statusLabel: getStatusLabel(entry.status),
      location: entry.location,
      note: entry.note,
      createdAt: entry.createdAt
    }))
  };
}

const PDF_COLORS = {
  ink: "#000000",
  signal: "#000000",
  muted: "#4B5563",
  text: "#111827",
  border: "#000000",
  soft: "#FFFFFF",
  table: "#F3F4F6"
};

const PDF_PAGE = {
  left: 42,
  right: 42,
  bottom: 64
};

export function renderReceiptPdf(shipment, stream) {
  const doc = new PDFDocument({ bufferPages: true, margin: 42, size: "A4" });
  doc.pipe(stream);

  drawReceiptHeader(doc, shipment);
  drawSummaryStrip(doc, shipment);
  drawPartyCards(doc, shipment);
  drawFieldGrid(doc, "Shipment Details", [
    ["Origin", shipment.origin],
    ["Destination", shipment.destination],
    ["Status", shipment.statusLabel],
    ["Current Location", shipment.currentLocation],
    ["Package Description", shipment.packageDescription],
    ["Carrier", shipment.carrier],
    ["Shipment Mode", shipment.shipmentMode],
    ["Weight", shipment.weight],
    ["Payment Mode", shipment.paymentMode],
    ["Total Freight", shipment.totalFreight],
    ["Expected Delivery Date", formatDate(shipment.estimatedDeliveryDate)],
    ["Departure Time", shipment.departureTime],
    ["Pick-up Date", formatDateOnly(shipment.pickupDate)],
    ["Pick-up Time", shipment.pickupTime]
  ]);
  
  drawFooter(doc);

  doc.end();
}

function drawReceiptHeader(doc, shipment) {
  const left = PDF_PAGE.left;
  const width = pageWidth(doc);
  const rightBoxWidth = 200;
  const y = 42;

  let logoDrawn = false;
  try {
    const logoPath = path.resolve(process.cwd(), "../web/public/logo/Logo.png");
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, left, y, { height: 40 });
      logoDrawn = true;
    }
  } catch (e) {}

  if (!logoDrawn) {
    doc.font("Helvetica-Bold").fontSize(24).fillColor(PDF_COLORS.ink).text("TRANSPORT-LINK", left, y);
  }

  doc.font("Helvetica").fontSize(8).fillColor(PDF_COLORS.muted)
     .text("123 Logistics Avenue, Global Hub\nsupport@transport-link.com\n+1 (800) 555-0199", left, y + (logoDrawn ? 45 : 30));

  doc
    .font("Helvetica-Bold")
    .fontSize(18)
    .fillColor(PDF_COLORS.ink)
    .text("WAYBILL / CONSIGNMENT", left + width - rightBoxWidth, y, { width: rightBoxWidth, align: "right" });

  doc
    .rect(left + width - rightBoxWidth, y + 25, rightBoxWidth, 45)
    .stroke(PDF_COLORS.border)
    .font("Helvetica-Bold")
    .fontSize(8)
    .fillColor(PDF_COLORS.muted)
    .text("TRACKING NO.", left + width - rightBoxWidth + 8, y + 33, { width: rightBoxWidth - 16, align: "left" })
    .fontSize(16)
    .fillColor(PDF_COLORS.ink)
    .text(shipment.trackingId, left + width - rightBoxWidth + 8, y + 48, { width: rightBoxWidth - 16, align: "right" });

  doc.y = y + 90;
  resetCursor(doc);
}

function drawSummaryStrip(doc, shipment) {
  const items = [
    ["STATUS", shipment.statusLabel],
    ["ORIGIN", shipment.origin],
    ["DESTINATION", shipment.destination],
    ["EXPECTED DELIVERY", formatDateOnly(shipment.estimatedDeliveryDate)]
  ];
  const cellWidth = pageWidth(doc) / items.length;
  const y = doc.y;

  items.forEach(([label, value], index) => {
    const x = PDF_PAGE.left + index * cellWidth;
    doc.rect(x, y, cellWidth, 40).fillAndStroke(PDF_COLORS.soft, PDF_COLORS.border);
    doc.font("Helvetica-Bold").fontSize(7).fillColor(PDF_COLORS.muted).text(label, x + 6, y + 6, { width: cellWidth - 12 });
    doc.font("Helvetica-Bold").fontSize(9).fillColor(PDF_COLORS.ink).text(printValue(value), x + 6, y + 18, { width: cellWidth - 12, height: 20 });
  });

  doc.y = y + 40;
  resetCursor(doc);
}

function drawPartyCards(doc, shipment) {
  const cardWidth = pageWidth(doc) / 2;
  const cards = [
    {
      title: "SHIPPER DETAILS",
      rows: [
        ["Name", shipment.senderName],
        ["Address", shipment.senderAddress],
        ["Phone", shipment.senderPhone]
      ]
    },
    {
      title: "RECEIVER DETAILS",
      rows: [
        ["Name", shipment.receiverName],
        ["Address", shipment.receiverAddress],
        ["Phone", shipment.receiverPhone]
      ]
    }
  ];
  const heights = cards.map((card) => measureInfoCard(doc, card.rows, cardWidth));
  const height = Math.max(...heights);

  ensureSpace(doc, height);
  const y = doc.y;

  cards.forEach((card, index) => {
    drawInfoCard(doc, PDF_PAGE.left + index * cardWidth, y, cardWidth, height, card.title, card.rows);
  });

  doc.y = y + height;
  resetCursor(doc);
}

function measureInfoCard(doc, rows, width) {
  const valueWidth = width - 80;
  doc.font("Helvetica").fontSize(8);
  const rowsHeight = rows.reduce((sum, [, value]) => sum + Math.max(12, doc.heightOfString(printValue(value), { width: valueWidth }) + 2), 0);
  return Math.max(90, 30 + rowsHeight + 10);
}

function drawInfoCard(doc, x, y, width, height, title, rows) {
  doc.rect(x, y, width, height).fillAndStroke(PDF_COLORS.soft, PDF_COLORS.border);
  doc.rect(x, y, width, 20).fillAndStroke(PDF_COLORS.table, PDF_COLORS.border);
  doc.font("Helvetica-Bold").fontSize(9).fillColor(PDF_COLORS.ink).text(title, x + 6, y + 6, { width: width - 12 });

  let rowY = y + 26;
  rows.forEach(([label, value]) => {
    doc.font("Helvetica-Bold").fontSize(8).fillColor(PDF_COLORS.muted).text(label, x + 6, rowY, { width: 50 });
    doc.font("Helvetica").fontSize(8).fillColor(PDF_COLORS.text).text(printValue(value), x + 60, rowY, { width: width - 70 });
    rowY += Math.max(12, doc.heightOfString(printValue(value), { width: width - 70 }) + 2);
  });
}

function drawFieldGrid(doc, title, rows) {
  drawSectionTitle(doc, title);
  const columns = 2;
  const cellWidth = pageWidth(doc) / columns;

  for (let index = 0; index < rows.length; index += columns) {
    const group = rows.slice(index, index + columns);
    const cellHeights = group.map(([, value]) => {
      doc.font("Helvetica-Bold").fontSize(8);
      return Math.max(30, 18 + doc.heightOfString(printValue(value), { width: cellWidth - 12 }));
    });
    const rowHeight = Math.max(...cellHeights);
    ensureSpace(doc, rowHeight);
    const y = doc.y;

    group.forEach(([label, value], columnIndex) => {
      const x = PDF_PAGE.left + columnIndex * cellWidth;
      doc.rect(x, y, cellWidth, rowHeight).fillAndStroke(PDF_COLORS.soft, PDF_COLORS.border);
      doc.font("Helvetica-Bold").fontSize(7).fillColor(PDF_COLORS.muted).text(label.toUpperCase(), x + 6, y + 4, { width: cellWidth - 12 });
      doc.font("Helvetica-Bold").fontSize(9).fillColor(PDF_COLORS.ink).text(printValue(value), x + 6, y + 14, { width: cellWidth - 12 });
    });

    doc.y = y + rowHeight;
    resetCursor(doc);
  }
}

function drawSectionTitle(doc, title) {
  ensureSpace(doc, 26);
  doc.y += 10;
  resetCursor(doc);
  doc.rect(PDF_PAGE.left, doc.y, pageWidth(doc), 16).fillAndStroke(PDF_COLORS.ink, PDF_COLORS.border);
  doc.font("Helvetica-Bold").fontSize(9).fillColor(PDF_COLORS.soft).text(title.toUpperCase(), PDF_PAGE.left + 6, doc.y + 4, { width: pageWidth(doc) - 12 });
  doc.y += 16;
  resetCursor(doc);
}

function drawFooter(doc) {
  ensureSpace(doc, 120);
  doc.y += 30;
  const y = doc.y;
  
  doc.font("Helvetica-Bold").fontSize(10).fillColor(PDF_COLORS.ink).text("AUTHORIZATION & SIGNATURE", PDF_PAGE.left, y);
  
  doc.font("Helvetica").fontSize(8).fillColor(PDF_COLORS.text)
    .text("I hereby confirm that the details provided above are accurate and the shipment complies with all applicable regulations. This waybill serves as a binding agreement for carriage under the standard terms and conditions of Transport-Link.", PDF_PAGE.left, y + 16, { width: pageWidth(doc) });
    
  doc.rect(PDF_PAGE.left, y + 60, 200, 1).stroke(PDF_COLORS.border);
  doc.font("Helvetica-Bold").fontSize(8).fillColor(PDF_COLORS.muted).text("AUTHORIZED SIGNATURE", PDF_PAGE.left, y + 65);
  
  doc.rect(PDF_PAGE.left + 250, y + 60, 150, 1).stroke(PDF_COLORS.border);
  doc.font("Helvetica-Bold").fontSize(8).fillColor(PDF_COLORS.muted).text("DATE", PDF_PAGE.left + 250, y + 65);
  
  const generatedText = `Generated on ${new Date().toUTCString()}`;
  doc.font("Helvetica").fontSize(7).fillColor(PDF_COLORS.muted).text(generatedText, PDF_PAGE.left, pageBottom(doc) + 10, { width: pageWidth(doc), align: "center" });
}

function ensureSpace(doc, height) {
  if (doc.y + height > pageBottom(doc)) {
    doc.addPage();
    resetCursor(doc);
  }
}

function resetCursor(doc) {
  doc.x = PDF_PAGE.left;
}

function pageWidth(doc) {
  return doc.page.width - PDF_PAGE.left - PDF_PAGE.right;
}

function pageBottom(doc) {
  return doc.page.height - PDF_PAGE.bottom;
}

function printValue(value) {
  if (value === null || value === undefined || value === "") {
    return "Not set";
  }

  const text = String(value).replace(/\s+/g, " ").trim();
  return text.length > 140 ? `${text.slice(0, 137)}...` : text;
}

function formatDate(value) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatDateOnly(value) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium"
  }).format(new Date(value));
}

function formatMeasurement(value, unit) {
  if (value === null || value === undefined || value === "") {
    return "Not set";
  }

  return `${value} ${unit}`;
}
