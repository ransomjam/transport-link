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
          <Link className="rounded-md bg-signal px-4 py-2 text-sm font-semibold text-white" href="/admin/shipments/new">
            New shipment
          </Link>
        }
      >
        {error ? <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
        <div className="grid gap-4 md:grid-cols-4">
          {[
            ["Total shipments", stats?.totalShipments ?? "-"],
            ["In transit", stats?.inTransit ?? "-"],
            ["Delivered", stats?.delivered ?? "-"],
            ["Delayed", stats?.delayed ?? "-"],
            ["On hold", stats?.onHold ?? "-"],
            ["Cancelled", stats?.cancelled ?? "-"],
            ["Today new", stats?.todayNewShipments ?? "-"]
          ].map(([label, value]) => (
            <div key={label} className="rounded-md bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="text-sm font-medium text-slate-500">{label}</div>
              <div className="mt-2 text-3xl font-semibold text-ink">{value}</div>
            </div>
          ))}
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}
