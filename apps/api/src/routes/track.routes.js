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

  drawBarcodeSection(doc, shipment);

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

  const boxX = left + width - rightBoxWidth;

  // Title (wraps to two lines). Measure its real height so the tracking box is
  // placed below it instead of overlapping.
  const titleText = "WAYBILL / CONSIGNMENT";
  doc.font("Helvetica-Bold").fontSize(17).fillColor(PDF_COLORS.ink);
  const titleHeight = doc.heightOfString(titleText, { width: rightBoxWidth, align: "right" });
  doc.text(titleText, boxX, y, { width: rightBoxWidth, align: "right" });

  const boxY = y + titleHeight + 8;
  const boxHeight = 46;
  doc
    .rect(boxX, boxY, rightBoxWidth, boxHeight)
    .stroke(PDF_COLORS.border)
    .font("Helvetica-Bold")
    .fontSize(8)
    .fillColor(PDF_COLORS.muted)
    .text("TRACKING NO.", boxX + 8, boxY + 8, { width: rightBoxWidth - 16, align: "left" })
    .fontSize(15)
    .fillColor(PDF_COLORS.ink)
    .text(shipment.trackingId, boxX + 8, boxY + 22, { width: rightBoxWidth - 16, align: "right" });

  // Header ends below whichever side is taller (logo/address vs. title/box).
  const leftBottom = y + (logoDrawn ? 45 : 30) + 34;
  doc.y = Math.max(boxY + boxHeight, leftBottom) + 14;
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

function drawBarcodeSection(doc, shipment) {
  const barcodeHeight = 58;
  const sectionHeight = barcodeHeight + 44;
  ensureSpace(doc, sectionHeight + 24);
  doc.y += 24;
  const top = doc.y;
  const centerX = PDF_PAGE.left + pageWidth(doc) / 2;

  drawBarcode(doc, shipment.trackingId, centerX, top, {
    height: barcodeHeight,
    moduleWidth: 1.5,
    maxWidth: pageWidth(doc) - 20
  });

  doc
    .font("Helvetica-Bold")
    .fontSize(14)
    .fillColor(PDF_COLORS.ink)
    .text(String(shipment.trackingId ?? "").toUpperCase(), PDF_PAGE.left, top + barcodeHeight + 10, {
      width: pageWidth(doc),
      align: "center",
      characterSpacing: 4
    });

  const generatedText = `Generated on ${new Date().toUTCString()}`;
  doc
    .font("Helvetica")
    .fontSize(7)
    .fillColor(PDF_COLORS.muted)
    .text(generatedText, PDF_PAGE.left, pageBottom(doc) + 10, { width: pageWidth(doc), align: "center" });
}

// Draw a Code 128 (subset B) barcode centred on `centerX`, starting at `top`.
function drawBarcode(doc, value, centerX, top, { height = 58, moduleWidth = 1.5, maxWidth } = {}) {
  const segments = encodeCode128(value);
  if (!segments.length) {
    return;
  }

  const totalModules = segments.reduce((sum, segment) => sum + segment.width, 0);
  let mw = moduleWidth;
  if (maxWidth && totalModules * mw > maxWidth) {
    mw = maxWidth / totalModules;
  }

  const barcodeWidth = totalModules * mw;
  let x = centerX - barcodeWidth / 2;

  doc.save();
  for (const segment of segments) {
    const segmentWidth = segment.width * mw;
    if (segment.bar) {
      doc.rect(x, top, segmentWidth, height).fill("#000000");
    }
    x += segmentWidth;
  }
  doc.restore();
}

// Code 128 bar/space width patterns for values 0-105 (Start B = 104).
const CODE128_PATTERNS = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
  "114131", "311141", "411131", "211412", "211214", "211232"
];
const CODE128_STOP = "2331112";

// Encode text into Code 128 subset B bar/space segments.
function encodeCode128(text) {
  const codes = [];
  for (const ch of String(text ?? "")) {
    const code = ch.charCodeAt(0);
    codes.push(code >= 32 && code <= 126 ? code : 63); // non-printable -> '?'
  }
  if (!codes.length) {
    return [];
  }

  const values = [104]; // Start B
  for (const code of codes) {
    values.push(code - 32);
  }
  let checksum = 104;
  codes.forEach((code, index) => {
    checksum += (code - 32) * (index + 1);
  });
  values.push(checksum % 103);

  const segments = [];
  const pushPattern = (pattern) => {
    for (let i = 0; i < pattern.length; i += 1) {
      segments.push({ width: Number(pattern[i]), bar: i % 2 === 0 });
    }
  };
  for (const value of values) {
    pushPattern(CODE128_PATTERNS[value]);
  }
  pushPattern(CODE128_STOP);
  return segments;
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
