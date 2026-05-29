"use client";

import dynamic from "next/dynamic";
import { formatDate } from "../lib/api";

const EstimatedRouteMap = dynamic(() => import("./EstimatedRouteMap"), {
  ssr: false,
  loading: () => <div className="h-[360px] rounded-md bg-slate-100 ring-1 ring-slate-200 md:h-[420px]" />
});

export default function RouteVisual({ shipment }) {
  const progress = Math.max(0, Math.min(100, Number(shipment.progressPercentage) || 0));

  return (
    <section className="overflow-hidden rounded-md bg-white shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <div>
          <h2 className="text-xl font-semibold text-[#0F2742]">Estimated Route</h2>
          <p className="mt-1 text-sm text-slate-600">Shipment Route with the Last Updated Location when location coordinates are available.</p>
        </div>
      </div>

      <div className="p-5">
        <EstimatedRouteMap shipment={shipment} />

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-normal text-slate-500">
            <span>Estimated Delivery Progress</span>
            <span className="text-[#0AA66D]">{progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-200">
            <div className="h-2 rounded-full bg-[#0AA66D]" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-2 text-xs text-slate-500">Estimated delivery date: {formatDate(shipment.estimatedDeliveryDate)}</p>
        </div>
      </div>
    </section>
  );
}
