"use client";

import { useMemo, useState } from "react";
import { apiRequest } from "../lib/api";

const shipmentFields = [
  "trackingId",
  "currentStatus",
  "shipmentType",
  "senderName",
  "senderAddress",
  "senderPhone",
  "senderEmail",
  "receiverName",
  "receiverAddress",
  "receiverPhone",
  "receiverEmail",
  "origin",
  "destination",
  "currentLocation",
  "packageDescription",
  "carrier",
  "shipmentMode",
  "weight",
  "quantity",
  "paymentMode",
  "totalFreight",
  "pickupDate",
  "pickupTime",
  "departureDate",
  "departureTime",
  "estimatedDeliveryDate",
  "actualDeliveryDate",
  "comments",
  "publicNote",
  "adminNote",
  "originLat",
  "originLng",
  "destinationLat",
  "destinationLng",
  "currentLocationLat",
  "currentLocationLng",
  "autoProgress"
];

const packageFields = [
  "packageQty",
  "packagePieces",
  "packageDetailDescription",
  "packageLengthCm",
  "packageWidthCm",
  "packageHeightCm",
  "packageWeightKg",
  "packages"
];

const requiredFields = ["senderName", "receiverName", "origin", "destination", "estimatedDeliveryDate"];

export default function ShipmentCsvImport({ onImported }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [results, setResults] = useState([]);
  const [importing, setImporting] = useState(false);

  const headers = useMemo(() => [...shipmentFields, ...packageFields], []);

  async function importCsv(event) {
    event.preventDefault();
    if (!file) {
      setError("Choose a CSV file first.");
      return;
    }

    setError("");
    setStatus("Reading CSV...");
    setResults([]);
    setImporting(true);

    try {
      const text = await file.text();
      const rows = parseCsvObjects(text);

      if (!rows.length) {
        throw new Error("The CSV file does not contain any shipment rows.");
      }

      const imported = [];
      const failed = [];

      for (const [index, row] of rows.entries()) {
        const rowNumber = index + 2;
        const missing = requiredFields.filter((field) => !clean(row[field]));

        if (missing.length) {
          failed.push({ row: rowNumber, message: `Missing ${missing.join(", ")}` });
          continue;
        }

        try {
          setStatus(`Importing row ${rowNumber} of ${rows.length + 1}...`);
          const data = await apiRequest("/shipments", {
            method: "POST",
            body: toShipmentPayload(row)
          });
          imported.push(data.shipment);
        } catch (issue) {
          failed.push({ row: rowNumber, message: issue.message });
        }
      }

      setResults([
        ...imported.map((shipment) => ({
          type: "success",
          message: `${shipment.trackingId} imported for ${shipment.receiverName}`
        })),
        ...failed.map((item) => ({
          type: "error",
          message: `Row ${item.row}: ${item.message}`
        }))
      ]);
      setStatus(`${imported.length} imported, ${failed.length} failed.`);

      if (imported.length && typeof onImported === "function") {
        onImported(imported);
      }
    } catch (issue) {
      setError(issue.message);
      setStatus("");
    } finally {
      setImporting(false);
    }
  }

  return (
    <section className="rounded-md bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink">Import Shipments</h2>
          <p className="mt-1 text-sm text-slate-600">Upload CSV rows with the shipment fields used by this form.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-signal hover:text-signal" href="/shipment-import-template.csv" download>
            Download template
          </a>
          <a className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-signal hover:text-signal" href="/demo-shipments.csv" download>
            Download demo CSV
          </a>
        </div>
      </div>

      <form onSubmit={importCsv} className="grid gap-3 md:grid-cols-[1fr_auto]">
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          CSV File
          <input
            accept=".csv,text/csv"
            className="min-h-11 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-ink focus:border-signal"
            type="file"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
        </label>
        <button disabled={importing} className="self-end rounded-md bg-ink px-4 py-3 text-sm font-semibold text-white disabled:opacity-70">
          {importing ? "Importing..." : "Import CSV"}
        </button>
      </form>

      <details className="mt-4 rounded-md bg-slate-50 p-3 text-sm text-slate-600 ring-1 ring-slate-200">
        <summary className="cursor-pointer font-semibold text-slate-700">CSV fields</summary>
        <p className="mt-2 break-words leading-6">{headers.join(", ")}</p>
      </details>

      {status ? <p className="mt-4 rounded-md bg-slate-50 p-3 text-sm text-slate-700">{status}</p> : null}
      {error ? <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

      {results.length ? (
        <div className="mt-4 max-h-56 overflow-auto rounded-md border border-slate-200">
          <ul className="divide-y divide-slate-100 text-sm">
            {results.map((item, index) => (
              <li key={`${item.message}-${index}`} className={`px-3 py-2 ${item.type === "error" ? "text-red-700" : "text-emerald-700"}`}>
                {item.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function toShipmentPayload(row) {
  const payload = {};

  shipmentFields.forEach((field) => {
    payload[field] = clean(row[field]);
  });

  payload.packages = parsePackages(row);

  return payload;
}

function parsePackages(row) {
  const packagesJson = clean(row.packages);

  if (packagesJson) {
    try {
      const parsed = JSON.parse(packagesJson);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      return [];
    }
  }

  const item = {
    qty: clean(row.packageQty),
    pieces: clean(row.packagePieces),
    description: clean(row.packageDetailDescription),
    lengthCm: clean(row.packageLengthCm),
    widthCm: clean(row.packageWidthCm),
    heightCm: clean(row.packageHeightCm),
    weightKg: clean(row.packageWeightKg)
  };

  return Object.values(item).some(Boolean) ? [item] : [];
}

function clean(value) {
  return String(value ?? "").trim();
}

function parseCsvObjects(text) {
  const rows = parseCsv(text.replace(/^\uFEFF/, ""));
  const headers = rows.shift()?.map(clean) ?? [];

  if (!headers.length) {
    return [];
  }

  return rows
    .filter((row) => row.some((value) => clean(value)))
    .map((row) =>
      Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""]))
    );
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }

    field += char;
  }

  row.push(field);
  rows.push(row);

  return rows.filter((item) => item.some((value) => clean(value)));
}
