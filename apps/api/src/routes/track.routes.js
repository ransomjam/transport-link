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
  ink: "#0F2742",
  signal: "#049DBF",
  muted: "#64748B",
  text: "#111827",
  border: "#CBD5E1",
  soft: "#F5F8FA",
  table: "#F1F5F9"
};

const PDF_PAGE = {
  left: 42,
  right: 42,
  bottom: 64
};

function renderReceiptPdf(shipment, stream) {
  const doc = new PDFDocument({ bufferPages: true, margin: 42, size: "A4" });
  doc.pipe(stream);

  drawReceiptHeader(doc, shipment);
  drawSummaryStrip(doc, shipment);
  drawPartyCards(doc, shipment);
  drawFieldGrid(doc, "Shipment Information", [
    ["Origin", shipment.origin],
    ["Destination", shipment.destination],
    ["Status", shipment.statusLabel],
    ["Last Updated Location", shipment.currentLocation],
    ["Package", shipment.packageDescription],
    ["Carrier", shipment.carrier],
    ["Shipment Mode", shipment.shipmentMode],
    ["Weight", shipment.weight],
    ["Carrier Reference No.", shipment.trackingId],
    ["Quantity", shipment.quantity],
    ["Payment Mode", shipment.paymentMode],
    ["Total Freight", shipment.totalFreight],
    ["Expected Delivery Date", formatDate(shipment.estimatedDeliveryDate)],
    ["Departure Time", shipment.departureTime],
    ["Pick-up Date", formatDateOnly(shipment.pickupDate)],
    ["Pick-up Time", shipment.pickupTime],
    ["Comments", shipment.comments ?? shipment.publicNote]
  ]);
  drawPackagesTable(doc, shipment.packages);
  drawHistoryTable(doc, shipment.history);
  drawRouteBox(doc, shipment);
  drawPageFooters(doc);

  doc.end();
}

function drawReceiptHeader(doc, shipment) {
  const left = PDF_PAGE.left;
  const width = pageWidth(doc);
  const rightBoxWidth = 170;
  const y = 42;

  let logoDrawn = false;
  try {
    const logoPath = path.resolve(process.cwd(), "../web/public/logo/Logo.png");
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, left, y + 8, { width: 72 });
      logoDrawn = true;
    }
  } catch (e) {}

  if (!logoDrawn) {
    doc.roundedRect(left, y, 72, 52, 6).fillAndStroke(PDF_COLORS.soft, PDF_COLORS.border);
    doc.font("Helvetica-Bold").fontSize(14).fillColor(PDF_COLORS.ink).text("THX", left, y + 18, { width: 72, align: "center" });
  }

  doc
    .font("Helvetica-Bold")
    .fontSize(21)
    .fillColor(PDF_COLORS.ink)
    .text("transport-link Express", left + 90, y + 4, { width: width - rightBoxWidth - 106 })
    .font("Helvetica")
    .fontSize(10)
    .fillColor(PDF_COLORS.muted)
    .text("Shipment Tracking Receipt", left + 90, y + 32, { width: width - rightBoxWidth - 106 });

  doc
    .roundedRect(left + width - rightBoxWidth, y, rightBoxWidth, 72, 6)
    .fillAndStroke("#FFFFFF", PDF_COLORS.border)
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor(PDF_COLORS.muted)
    .text("Consignment No.", left + width - rightBoxWidth + 12, y + 12, { width: rightBoxWidth - 24, align: "right" })
    .fontSize(14)
    .fillColor(PDF_COLORS.ink)
    .text(shipment.trackingId, left + width - rightBoxWidth + 12, y + 27, { width: rightBoxWidth - 24, align: "right" })
    .font("Helvetica")
    .fontSize(8)
    .fillColor(PDF_COLORS.muted)
    .text(`Generated: ${formatDate(new Date())}`, left + width - rightBoxWidth + 12, y + 50, { width: rightBoxWidth - 24, align: "right" });

  doc.y = y + 96;
  resetCursor(doc);
}

function drawSummaryStrip(doc, shipment) {
  const items = [
    ["Status", shipment.statusLabel],
    ["Origin", shipment.origin],
    ["Destination", shipment.destination],
    ["Expected Delivery", formatDateOnly(shipment.estimatedDeliveryDate)]
  ];
  const gap = 8;
  const cellWidth = (pageWidth(doc) - gap * (items.length - 1)) / items.length;
  const y = doc.y;

  items.forEach(([label, value], index) => {
    const x = PDF_PAGE.left + index * (cellWidth + gap);
    doc.roundedRect(x, y, cellWidth, 52, 5).fillAndStroke(PDF_COLORS.soft, PDF_COLORS.border);
    doc.font("Helvetica-Bold").fontSize(7.5).fillColor(PDF_COLORS.muted).text(label, x + 8, y + 9, { width: cellWidth - 16 });
    doc.font("Helvetica-Bold").fontSize(9.5).fillColor(PDF_COLORS.ink).text(printValue(value), x + 8, y + 24, { width: cellWidth - 16, height: 20 });
  });

  doc.y = y + 70;
  resetCursor(doc);
}

function drawPartyCards(doc, shipment) {
  const gap = 12;
  const cardWidth = (pageWidth(doc) - gap) / 2;
  const cards = [
    {
      title: "Shipper Information",
      rows: [
        ["Name", shipment.senderName],
        ["Address", shipment.senderAddress],
        ["Phone", shipment.senderPhone],
        ["Email", shipment.senderEmail]
      ]
    },
    {
      title: "Receiver Information",
      rows: [
        ["Name", shipment.receiverName],
        ["Address", shipment.receiverAddress],
        ["Phone", shipment.receiverPhone],
        ["Email", shipment.receiverEmail]
      ]
    }
  ];
  const heights = cards.map((card) => measureInfoCard(doc, card.rows, cardWidth));
  const height = Math.max(...heights);

  ensureSpace(doc, height + 14);
  const y = doc.y;

  cards.forEach((card, index) => {
    drawInfoCard(doc, PDF_PAGE.left + index * (cardWidth + gap), y, cardWidth, height, card.title, card.rows);
  });

  doc.y = y + height + 18;
  resetCursor(doc);
}

function measureInfoCard(doc, rows, width) {
  const valueWidth = width - 94;
  doc.font("Helvetica").fontSize(8.5);
  const rowsHeight = rows.reduce((sum, [, value]) => sum + Math.max(15, doc.heightOfString(printValue(value), { width: valueWidth }) + 3), 0);
  return Math.max(112, 38 + rowsHeight + 12);
}

function drawInfoCard(doc, x, y, width, height, title, rows) {
  doc.roundedRect(x, y, width, height, 6).fillAndStroke("#FFFFFF", PDF_COLORS.border);
  doc.font("Helvetica-Bold").fontSize(11).fillColor(PDF_COLORS.ink).text(title, x + 12, y + 12, { width: width - 24 });

  let rowY = y + 36;
  rows.forEach(([label, value]) => {
    doc.font("Helvetica-Bold").fontSize(8).fillColor(PDF_COLORS.muted).text(label, x + 12, rowY, { width: 58 });
    doc.font("Helvetica").fontSize(8.5).fillColor(PDF_COLORS.text).text(printValue(value), x + 76, rowY, { width: width - 88 });
    rowY += Math.max(15, doc.heightOfString(printValue(value), { width: width - 88 }) + 3);
  });
}

function drawFieldGrid(doc, title, rows) {
  drawSectionTitle(doc, title);
  const columns = 3;
  const gap = 8;
  const cellWidth = (pageWidth(doc) - gap * (columns - 1)) / columns;

  for (let index = 0; index < rows.length; index += columns) {
    const group = rows.slice(index, index + columns);
    const cellHeights = group.map(([, value]) => {
      doc.font("Helvetica-Bold").fontSize(8.5);
      return Math.max(48, 26 + doc.heightOfString(printValue(value), { width: cellWidth - 16 }));
    });
    const rowHeight = Math.max(...cellHeights);
    ensureSpace(doc, rowHeight + 8);
    const y = doc.y;

    group.forEach(([label, value], columnIndex) => {
      const x = PDF_PAGE.left + columnIndex * (cellWidth + gap);
      doc.roundedRect(x, y, cellWidth, rowHeight, 5).fillAndStroke("#FFFFFF", PDF_COLORS.border);
      doc.font("Helvetica-Bold").fontSize(7.5).fillColor(PDF_COLORS.muted).text(label, x + 8, y + 8, { width: cellWidth - 16 });
      doc.font("Helvetica-Bold").fontSize(8.7).fillColor(PDF_COLORS.ink).text(printValue(value), x + 8, y + 23, { width: cellWidth - 16 });
    });

    doc.y = y + rowHeight + 8;
    resetCursor(doc);
  }

  doc.y += 6;
}

function drawPackagesTable(doc, packages) {
  const columns = [
    { label: "Qty", width: 34 },
    { label: "Pieces", width: 44 },
    { label: "Description", width: 176 },
    { label: "Length", width: 58 },
    { label: "Width", width: 52 },
    { label: "Height", width: 52 },
    { label: "Weight", width: 70 }
  ];
  const rows = packages.length
    ? packages.map((item) => [
        item.qty,
        item.pieces,
        item.description,
        formatMeasurement(item.lengthCm, "cm"),
        formatMeasurement(item.widthCm, "cm"),
        formatMeasurement(item.heightCm, "cm"),
        formatMeasurement(item.weightKg, "kg")
      ])
    : [["Not set", "", "", "", "", "", ""]];

  drawDataTable(doc, "Packages", columns, rows);
}

function drawHistoryTable(doc, history) {
  const columns = [
    { label: "Date", width: 76 },
    { label: "Time", width: 58 },
    { label: "Location", width: 128 },
    { label: "Status", width: 90 },
    { label: "Note", width: 134 }
  ];
  const rows = history.length
    ? history.map((entry) => [formatDateOnly(entry.createdAt), formatTime(entry.createdAt), entry.location, entry.statusLabel, entry.note])
    : [["Not set", "", "", "", ""]];

  drawDataTable(doc, "Shipment History", columns, rows);
}

function drawDataTable(doc, title, columns, rows) {
  drawSectionTitle(doc, title);
  drawTableHeader(doc, columns);

  rows.forEach((row) => {
    const rowHeight = measureTableRow(doc, columns, row);

    if (doc.y + rowHeight > pageBottom(doc)) {
      doc.addPage();
      resetCursor(doc);
      drawSectionTitle(doc, title);
      drawTableHeader(doc, columns);
    }

    drawTableRow(doc, columns, row, rowHeight);
  });

  doc.y += 14;
  resetCursor(doc);
}

function drawTableHeader(doc, columns) {
  ensureSpace(doc, 28);
  const y = doc.y;
  let x = PDF_PAGE.left;

  columns.forEach((column) => {
    doc.rect(x, y, column.width, 24).fillAndStroke(PDF_COLORS.table, PDF_COLORS.border);
    doc.font("Helvetica-Bold").fontSize(8).fillColor(PDF_COLORS.ink).text(column.label, x + 5, y + 8, { width: column.width - 10, height: 12 });
    x += column.width;
  });

  doc.y = y + 24;
  resetCursor(doc);
}

function measureTableRow(doc, columns, row) {
  doc.font("Helvetica").fontSize(8);
  const heights = row.map((value, index) => doc.heightOfString(printValue(value), { width: columns[index].width - 10 }) + 12);
  return Math.max(26, ...heights);
}

function drawTableRow(doc, columns, row, height) {
  const y = doc.y;
  let x = PDF_PAGE.left;

  row.forEach((value, index) => {
    const width = columns[index].width;
    doc.rect(x, y, width, height).stroke(PDF_COLORS.border);
    doc.font("Helvetica").fontSize(8).fillColor(PDF_COLORS.text).text(printValue(value), x + 5, y + 7, {
      width: width - 10,
      height: height - 10
    });
    x += width;
  });

  doc.y = y + height;
  resetCursor(doc);
}

function drawRouteBox(doc, shipment) {
  drawSectionTitle(doc, "Estimated Route / Map Summary");
  const route = [shipment.origin, shipment.currentLocation, shipment.destination].filter(Boolean).join(" -> ");
  const rows = [
    ["Shipment Route", route],
    ["Last Updated Location", shipment.currentLocation]
  ];
  const height = measureInfoCard(doc, rows, pageWidth(doc));
  ensureSpace(doc, height + 8);
  const y = doc.y;
  drawInfoCard(doc, PDF_PAGE.left, y, pageWidth(doc), height, "Route Summary", rows);
  doc.y = y + height + 14;
  resetCursor(doc);
}

function drawSectionTitle(doc, title) {
  ensureSpace(doc, 32);
  resetCursor(doc);
  doc.font("Helvetica-Bold").fontSize(12).fillColor(PDF_COLORS.ink).text(title, PDF_PAGE.left, doc.y, { width: pageWidth(doc) });
  doc.y += 8;
  resetCursor(doc);
}

function drawPageFooters(doc) {
  const range = doc.bufferedPageRange();

  for (let index = 0; index < range.count; index += 1) {
    doc.switchToPage(index);
    const y = doc.page.height - 48;
    doc.moveTo(PDF_PAGE.left, y - 8).lineTo(PDF_PAGE.left + pageWidth(doc), y - 8).stroke(PDF_COLORS.border);
    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .fillColor(PDF_COLORS.ink)
      .text("transport-link Express", PDF_PAGE.left, y, { width: 150 })
      .font("Helvetica")
      .fillColor(PDF_COLORS.muted)
      .text("This receipt is generated from admin-updated shipment tracking records and estimated delivery information.", PDF_PAGE.left + 150, y, {
        width: pageWidth(doc) - 220
      })
      .text(`Page ${index + 1} of ${range.count}`, PDF_PAGE.left + pageWidth(doc) - 58, y, { width: 58, align: "right" });
  }

  doc.switchToPage(range.count - 1);
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

  return String(value);
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

function formatTime(value) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    timeStyle: "short"
  }).format(new Date(value));
}

function formatMeasurement(value, unit) {
  if (value === null || value === undefined || value === "") {
    return "Not set";
  }

  return `${value} ${unit}`;
}
