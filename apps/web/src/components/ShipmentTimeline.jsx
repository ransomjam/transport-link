import { formatDate, statusLabel } from "../lib/api";

const routeStages = [
  "SHIPMENT_CREATED",
  "PICKED_UP",
  "IN_TRANSIT",
  "AT_SORTING_FACILITY",
  "ARRIVED_AT_DESTINATION_CITY",
  "OUT_FOR_DELIVERY",
  "DELIVERED"
];

export default function ShipmentTimeline({ shipment }) {
  const historyByStatus = new Map((shipment.history ?? []).map((entry) => [entry.status, entry]));
  const currentIndex = routeStages.indexOf(shipment.currentStatus);
  const isInterrupted = ["DELAYED", "ON_HOLD", "CANCELLED"].includes(shipment.currentStatus);

  return (
    <section className="rounded-md bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-[#0F2742]">Shipment Timeline</h2>
        {isInterrupted ? (
          <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">{statusLabel(shipment.currentStatus)}</span>
        ) : null}
      </div>

      <div className="grid gap-4">
        {routeStages.map((stage, index) => {
          const entry = historyByStatus.get(stage);
          const completed = Boolean(entry) || (currentIndex >= 0 && index <= currentIndex && !isInterrupted);
          const pending = !completed;

          return (
            <div key={stage} className="grid grid-cols-[28px_1fr] gap-3">
              <div className="relative flex justify-center">
                <span className={`mt-1 h-4 w-4 rounded-full ring-4 ${completed ? "bg-[#0AA66D] ring-emerald-100" : "bg-slate-300 ring-slate-100"}`} />
                {index < routeStages.length - 1 ? <span className="absolute top-6 h-[calc(100%+8px)] w-px bg-slate-200" /> : null}
              </div>
              <div className="pb-3">
                <div className="font-semibold text-[#0F2742]">{statusLabel(stage)}</div>
                <div className="mt-1 text-sm text-slate-600">
                  {entry?.location ?? (pending ? "Pending" : shipment.currentLocation ?? "Location not set")}
                </div>
                <div className="mt-1 text-sm text-slate-700">{entry?.note ?? (pending ? "Awaiting update" : "Completed")}</div>
                <div className="mt-1 text-xs text-slate-500">{entry ? formatDate(entry.createdAt) : ""}</div>
              </div>
            </div>
          );
        })}

        {isInterrupted ? (
          <div className="rounded-md bg-red-50 p-4">
            <div className="font-semibold text-red-700">{statusLabel(shipment.currentStatus)}</div>
            <div className="mt-1 text-sm text-slate-700">{shipment.publicNote ?? "Shipment requires attention."}</div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
