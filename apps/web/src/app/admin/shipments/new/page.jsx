"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminGuard from "../../../../components/AdminGuard";
import AdminLayout from "../../../../components/AdminLayout";
import ShipmentForm from "../../../../components/ShipmentForm";
import { apiRequest } from "../../../../lib/api";

export default function NewShipmentPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(body) {
    setError("");
    setLoading(true);

    try {
      const data = await apiRequest("/shipments", {
        method: "POST",
        body
      });

      router.replace(`/admin/shipments/${data.shipment.id}`);
    } catch (issue) {
      setError(issue.message);
      setLoading(false);
    }
  }

  return (
    <AdminGuard>
      <AdminLayout title="Add Shipment">
        {error ? <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
        <ShipmentForm onSubmit={submit} loading={loading} submitLabel="Create shipment" />
      </AdminLayout>
    </AdminGuard>
  );
}
