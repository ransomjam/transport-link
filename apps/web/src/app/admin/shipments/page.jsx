"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminGuard from "../../../components/AdminGuard";
import AdminLayout from "../../../components/AdminLayout";
import { apiRequest, formatDate, shipmentStatuses, statusLabel } from "../../../lib/api";

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState([]);
  const [filters, setFilters] = useState({ search: "", status: "", from: "", to: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadShipments(nextFilters = filters) {
    setError("");
    setLoading(true);
    const params = new URLSearchParams();

    Object.entries(nextFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });

    try {
      const data = await apiRequest(`/shipments${params.toString() ? `?${params}` : ""}`);
      setShipments(data.shipments);
    } catch (issue) {
      setError(issue.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadShipments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  return (
    <AdminGuard>
      <AdminLayout
        title="Shipments"
        action={
          <Link className="rounded-md bg-signal px-4 py-2 text-sm font-semibold text-white" href="/admin/shipments/new">
            New shipment
          </Link>
        }
      >
        <form
          className="mb-5 grid gap-3 rounded-md bg-white p-4 shadow-sm ring-1 ring-slate-200 md:grid-cols-5"
          onSubmit={(event) => {
            event.preventDefault();
            loadShipments();
          }}
        >
          <input
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="Tracking, sender, receiver"
            value={filters.search}
            onChange={(event) => updateFilter("search", event.target.value)}
          />
          <select
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={filters.status}
            onChange={(event) => updateFilter("status", event.target.value)}
          >
            <option value="">All statuses</option>
            {shipmentStatuses.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <input
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            type="date"
            value={filters.from}
            onChange={(event) => updateFilter("from", event.target.value)}
          />
          <input
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            type="date"
            value={filters.to}
            onChange={(event) => updateFilter("to", event.target.value)}
          />
          <button className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white">Search</button>
        </form>

        {error ? <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

        <div className="overflow-hidden rounded-md bg-white shadow-sm ring-1 ring-slate-200">
          <table className="w-full min-w-[860px] border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Tracking ID</th>
                <th className="px-4 py-3">Sender</th>
                <th className="px-4 py-3">Receiver</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Current location</th>
                <th className="px-4 py-3">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td className="px-4 py-5 text-slate-500" colSpan={6}>
                    Loading shipments...
                  </td>
                </tr>
              ) : shipments.length ? (
                shipments.map((shipment) => (
                  <tr key={shipment.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-signal">
                      <Link href={`/admin/shipments/${shipment.id}`}>{shipment.trackingId}</Link>
                    </td>
                    <td className="px-4 py-3">{shipment.senderName}</td>
                    <td className="px-4 py-3">{shipment.receiverName}</td>
                    <td className="px-4 py-3">{statusLabel(shipment.currentStatus)}</td>
                    <td className="px-4 py-3">{shipment.currentLocation ?? "Not set"}</td>
                    <td className="px-4 py-3">{formatDate(shipment.updatedAt)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-5 text-slate-500" colSpan={6}>
                    No shipments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}
