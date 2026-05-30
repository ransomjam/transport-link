"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import PublicLayout from "../../../components/PublicLayout";
import ProgressBar from "../../../components/ProgressBar";
import RouteVisual from "../../../components/RouteVisual";
import TrackingForm from "../../../components/TrackingForm";
import { API_URL, apiRequest, formatDate, formatDateOnly, formatTime, statusLabel } from "../../../lib/api";

export default function TrackingResultPage() {
  const params = useParams();
  const trackingId = params.trackingId;
  const [shipment, setShipment] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!trackingId) {
      return;
    }

    setLoading(true);
    setError("");

    apiRequest(`/track/${trackingId}`, { auth: false })
      .then((data) => setShipment(data.shipment))
      .catch((issue) => setError(issue.message))
      .finally(() => setLoading(false));
  }, [trackingId]);

  // Silently refresh so the map position stays current as the package advances
  // along its route (and reflects admin timeline changes) without a reload.
  useEffect(() => {
    if (!trackingId) {
      return undefined;
    }

    const timer = setInterval(() => {
      apiRequest(`/track/${trackingId}`, { auth: false })
        .then((data) => setShipment(data.shipment))
        .catch(() => {});
    }, 20000);

    return () => clearInterval(timer);
  }, [trackingId]);

  return (
    <PublicLayout>
      <main className="bg-[#F5F8FA] print:bg-white">
        <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
          {loading ? (
            <div className="rounded-md bg-white p-6 text-slate-600 shadow-sm ring-1 ring-slate-200">Loading tracking details...</div>
          ) : error ? (
            <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-md bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <p className="text-sm font-semibold uppercase tracking-normal text-[#049DBF]">Track & Trace</p>
                <h1 className="mt-2 text-3xl font-bold text-[#0F2742]">Shipment not found</h1>
                <p className="mt-3 leading-7 text-slate-600">{error}</p>
                <Link className="mt-5 inline-flex rounded-md bg-[#0F2742] px-4 py-2 text-sm font-semibold text-white" href="/track">
                  Try another Tracking Number
                </Link>
              </div>
              <TrackingForm horizontal />
            </section>
          ) : (
            <div className="grid gap-6">
              <section>
                <div className="mb-3">
                  <h2 className="text-xl font-semibold text-[#0F2742]">Package Location on Map</h2>
                </div>
                <RouteVisual shipment={shipment} />
              </section>

              <TrackingSummary shipment={shipment} />

              <div className="grid gap-6 lg:grid-cols-2">
                <PartyCard title="Shipper Information" rows={[
                  ["Name", shipment.senderName],
                  ["Address", shipment.senderAddress],
                  ["Phone", shipment.senderPhone],
                  ["Email", shipment.senderEmail]
                ]} />
                <PartyCard title="Receiver Information" rows={[
                  ["Name", shipment.receiverName],
                  ["Address", shipment.receiverAddress],
                  ["Phone", shipment.receiverPhone],
                  ["Email", shipment.receiverEmail]
                ]} />
              </div>

              <DetailsCard shipment={shipment} />
              <PackagesTable packages={shipment.packages ?? []} />

              <ShipmentHistoryTable history={shipment.history ?? []} />
            </div>
          )}
        </div>
      </main>
    </PublicLayout>
  );
}

function TrackingSummary({ shipment }) {
  return (
    <section className="rounded-md bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-normal text-[#049DBF]">Tracking Summary</p>
          <h1 className="mt-1 text-3xl font-bold text-[#0F2742]">{shipment.trackingId}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3 print:hidden">
          <button onClick={() => window.print()} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-[#0F2742] hover:border-[#049DBF] hover:text-[#049DBF]">
            Print Track Result
          </button>
          <a href={`${API_URL}/api/track/${encodeURIComponent(shipment.trackingId)}/receipt`} className="rounded-md bg-[#0F2742] px-4 py-2 text-sm font-semibold text-white hover:bg-[#049DBF]">
            Download Receipt
          </a>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Info label="Current Status" value={statusLabel(shipment.currentStatus)} />
        <Info label="Origin" value={shipment.origin} />
        <Info label="Destination" value={shipment.destination} />
        <Info label="Current Location" value={shipment.currentLocation ?? "Not set"} />
        <Info label="Estimated Delivery Date" value={formatDate(shipment.estimatedDeliveryDate)} />
        <Info label="Shipment Type" value={shipment.shipmentType ?? "Not set"} />
      </div>

      <div className="mt-6">
        <ProgressBar value={shipment.progressPercentage} />
      </div>
    </section>
  );
}

function PartyCard({ title, rows }) {
  return (
    <section className="rounded-md bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-xl font-semibold text-[#0F2742]">{title}</h2>
      <div className="mt-4 grid gap-3">
        {rows.map(([label, value]) => (
          <Info key={label} label={label} value={value ?? "Not set"} />
        ))}
      </div>
    </section>
  );
}

function DetailsCard({ shipment }) {
  const rows = [
    ["Origin", shipment.origin],
    ["Package", shipment.packageDescription],
    ["Status", statusLabel(shipment.currentStatus)],
    ["Destination", shipment.destination],
    ["Carrier", shipment.carrier],
    ["Shipment Mode", shipment.shipmentMode],
    ["Weight", shipment.weight],
    ["Carrier Reference No. / Tracking ID", shipment.trackingId],
    ["Quantity", shipment.quantity],
    ["Payment Mode", shipment.paymentMode],
    ["Total Freight", shipment.totalFreight],
    ["Expected Delivery Date", formatDate(shipment.estimatedDeliveryDate)],
    ["Departure Time", shipment.departureTime],
    ["Pick-up Date", formatDateOnly(shipment.pickupDate)],
    ["Pick-up Time", shipment.pickupTime],
    ["Comments", shipment.comments ?? shipment.publicNote]
  ];

  return (
    <section className="rounded-md bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-xl font-semibold text-[#0F2742]">Shipment Information</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {rows.map(([label, value]) => (
          <Info key={label} label={label} value={value ?? "Not set"} />
        ))}
      </div>
    </section>
  );
}

function PackagesTable({ packages }) {
  return (
    <section className="overflow-hidden rounded-md bg-white shadow-sm ring-1 ring-slate-200">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-xl font-semibold text-[#0F2742]">Packages</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              {["Qty", "Pieces", "Description", "Length (cm)", "Width (cm)", "Height (cm)", "Weight (kg)"].map((heading) => (
                <th key={heading} className="px-4 py-3 font-semibold">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {packages.length ? (
              packages.map((item, index) => (
                <tr key={index}>
                  <td className="px-4 py-3">{item.qty ?? "Not set"}</td>
                  <td className="px-4 py-3">{item.pieces ?? "Not set"}</td>
                  <td className="px-4 py-3">{item.description ?? "Not set"}</td>
                  <td className="px-4 py-3">{item.lengthCm ?? "Not set"}</td>
                  <td className="px-4 py-3">{item.widthCm ?? "Not set"}</td>
                  <td className="px-4 py-3">{item.heightCm ?? "Not set"}</td>
                  <td className="px-4 py-3">{item.weightKg ?? "Not set"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-5 text-slate-500" colSpan={7}>No package rows available.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ShipmentHistoryTable({ history }) {
  return (
    <section className="overflow-hidden rounded-md bg-white shadow-sm ring-1 ring-slate-200">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-xl font-semibold text-[#0F2742]">Shipment History</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              {["Date", "Time", "Location", "Status", "Note"].map((heading) => (
                <th key={heading} className="px-4 py-3 font-semibold">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {history.length ? (
              history.map((entry, index) => (
                <tr key={`${entry.status}-${entry.createdAt}-${index}`}>
                  <td className="px-4 py-3">{formatDateOnly(entry.createdAt)}</td>
                  <td className="px-4 py-3">{formatTime(entry.createdAt)}</td>
                  <td className="px-4 py-3">{entry.location ?? "Not set"}</td>
                  <td className="px-4 py-3 font-semibold text-[#0F2742]">{entry.statusLabel ?? statusLabel(entry.status)}</td>
                  <td className="px-4 py-3">{entry.note ?? "Not set"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-5 text-slate-500" colSpan={5}>No public shipment history available.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-md bg-[#F5F8FA] p-4">
      <div className="text-xs font-semibold uppercase tracking-normal text-slate-500">{label}</div>
      <div className="mt-1 text-base font-semibold text-[#0F2742]">{value}</div>
    </div>
  );
}
