"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TrackingForm({ className = "", horizontal = false, showDescription = true }) {
  const router = useRouter();
  const [trackingId, setTrackingId] = useState("");
  const [error, setError] = useState("");

  function submit(event) {
    event.preventDefault();
    const clean = trackingId.trim().toUpperCase();

    if (!clean) {
      setError("Enter a tracking number to continue.");
      return;
    }

    setError("");
    router.push(`/track/${encodeURIComponent(clean)}`);
  }

  return (
    <form onSubmit={submit} className={`rounded-md bg-white p-5 shadow-sm ring-1 ring-slate-200 ${className}`}>
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-[#0F2742]">Enter the Consignment No.</h2>
        <p className="mt-1 text-sm text-slate-500">Ex: 12345</p>
      </div>
      <div className={`grid gap-3 ${horizontal ? "md:grid-cols-[1fr_auto]" : ""}`}>
        <input
          value={trackingId}
          onChange={(event) => setTrackingId(event.target.value)}
          className="min-h-12 rounded-md border border-slate-300 px-4 text-base text-[#1F2937] outline-none transition focus:border-[#049DBF] focus:ring-2 focus:ring-[#049DBF]/20"
          placeholder="Enter Tracking Number"
          aria-label="Tracking Number"
        />
        <button className="min-h-12 rounded-md bg-[#0AA66D] px-5 text-sm font-semibold text-white transition hover:bg-[#078457]">
          Track Shipment
        </button>
      </div>
      {error ? <p className="mt-3 text-sm font-semibold text-red-700">{error}</p> : null}
      {showDescription ? (
        <p className="mt-4 text-sm leading-6 text-slate-600">
          Enter your tracking number to view full shipment details for Ocean, Air, Less-than-Container Load (LCL), Parcel, or other transport services.
        </p>
      ) : null}
    </form>
  );
}
