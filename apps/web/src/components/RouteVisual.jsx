"use client";

import dynamic from "next/dynamic";
import { formatDate } from "../lib/api";

const EstimatedRouteMap = dynamic(() => import("./EstimatedRouteMap"), {
  ssr: false,
  loading: () => <div className="h-[360px] rounded-md bg-slate-100 ring-1 ring-slate-200 md:h-[420px]" />
});

function formatDistanceKm(meters) {
  if (!Number.isFinite(meters)) {
    return null;
  }
  const km = meters / 1000;
  return `${km >= 100 ? Math.round(km) : km.toFixed(1)} km`;
}

export default function RouteVisual({ shipment }) {
  const progress = Math.max(0, Math.min(100, Number(shipment.progressPercentage) || 0));
  const movement = shipment.movement ?? {};
  const moving = Boolean(movement.animating);
  const speed = Number.isFinite(movement.speedKmh) ? Math.round(movement.speedKmh) : null;
  const totalDistance = formatDistanceKm(movement.distanceM);
  const remainingDistance = formatDistanceKm(movement.distanceRemainingM);

  return (
    <section className="overflow-hidden rounded-md bg-white shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <div>
          <h2 className="text-xl font-semibold text-[#0F2742]">Package Route</h2>
        </div>
      </div>

      <div className="p-5">
        <EstimatedRouteMap shipment={shipment} />

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-normal text-slate-500">
            <span>Delivery Progress</span>
            <span className="text-[#0AA66D]">{progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-200">
            <div className="h-2 rounded-full bg-[#0AA66D]" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-2 text-xs text-slate-500">Estimated delivery date: {formatDate(shipment.estimatedDeliveryDate)}</p>

          {totalDistance || speed != null ? (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {speed != null ? (
                <Stat
                  label={moving ? "Moving at" : "Avg. speed"}
                  value={`${speed} km/h`}
                  live={moving}
                />
              ) : null}
              {remainingDistance ? <Stat label="Distance left" value={remainingDistance} /> : null}
              {totalDistance ? <Stat label="Total route" value={totalDistance} /> : null}
              <Stat label="Status" value={moving ? "In motion" : "Stationary"} live={moving} />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value, live = false }) {
  return (
    <div className="rounded-md bg-[#F5F8FA] px-3 py-2 ring-1 ring-slate-200">
      <div className="text-[11px] font-semibold uppercase tracking-normal text-slate-500">{label}</div>
      <div className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-[#0F2742]">
        {live ? <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[#0AA66D]" /> : null}
        {value}
      </div>
    </div>
  );
}
