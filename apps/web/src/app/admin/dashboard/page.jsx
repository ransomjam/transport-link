"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminGuard from "../../../components/AdminGuard";
import AdminLayout from "../../../components/AdminLayout";
import { apiRequest } from "../../../lib/api";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest("/dashboard/stats").then(setStats).catch((issue) => setError(issue.message));
  }, []);

  return (
    <AdminGuard>
      <AdminLayout
        title="Dashboard"
        action={
          <Link
            className="rounded-md bg-signal px-3 py-2 text-xs font-semibold text-white shadow-sm sm:px-4 sm:text-sm"
            href="/admin/shipments/new"
          >
            New shipment
          </Link>
        }
      >
        {error ? <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
          {[
            ["Total shipments", stats?.totalShipments ?? "-"],
            ["In transit", stats?.inTransit ?? "-"],
            ["Delivered", stats?.delivered ?? "-"],
            ["Delayed", stats?.delayed ?? "-"],
            ["On hold", stats?.onHold ?? "-"],
            ["Cancelled", stats?.cancelled ?? "-"],
            ["Today new", stats?.todayNewShipments ?? "-"]
          ].map(([label, value]) => (
            <div key={label} className="min-h-[76px] rounded-md bg-white px-3 py-3 shadow-sm ring-1 ring-slate-200">
              <div className="truncate text-xs font-medium text-slate-500">{label}</div>
              <div className="mt-1 text-2xl font-semibold leading-none text-ink">{value}</div>
            </div>
          ))}
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}
