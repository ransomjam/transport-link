"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AdminGuard from "../../../../components/AdminGuard";
import AdminLayout from "../../../../components/AdminLayout";
import ShipmentForm from "../../../../components/ShipmentForm";
import RouteVisual from "../../../../components/RouteVisual";
import { apiRequest, formatDate, shipmentStatuses, statusLabel } from "../../../../lib/api";

export default function ShipmentDetailPage() {
  const params = useParams();
  const id = params.id;
  const [shipment, setShipment] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [hoursInput, setHoursInput] = useState("");
  const [movementBusy, setMovementBusy] = useState(false);

  async function loadShipment() {
    setError("");
    try {
      const data = await apiRequest(`/shipments/${id}`);
      setShipment(data.shipment);
    } catch (issue) {
      setError(issue.message);
    }
  }

  useEffect(() => {
    if (id) {
      loadShipment();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function updateShipment(body) {
    setError("");
    setMessage("");

    try {
      const data = await apiRequest(`/shipments/${id}`, {
        method: "PUT",
        body
      });
      setShipment((current) => ({ ...current, ...data.shipment }));
      setMessage("Shipment updated.");
      await loadShipment();
    } catch (issue) {
      setError(issue.message);
    }
  }

  async function sendMovement(body) {
    setError("");
    setMessage("");
    setMovementBusy(true);

    try {
      const data = await apiRequest(`/shipments/${id}/movement`, {
        method: "POST",
        body
      });
      setShipment((current) => ({ ...current, ...data.shipment }));
      setMessage("Movement updated.");
      await loadShipment();
    } catch (issue) {
      setError(issue.message);
    } finally {
      setMovementBusy(false);
    }
  }

  async function addHistory(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    const body = Object.fromEntries(new FormData(event.currentTarget).entries());

    try {
      await apiRequest(`/shipments/${id}/history`, {
        method: "POST",
        body
      });
      event.currentTarget.reset();
      setMessage("Timeline update added.");
      await loadShipment();
    } catch (issue) {
      setError(issue.message);
    }
  }

  return (
    <AdminGuard>
      <AdminLayout
        title={shipment ? shipment.trackingId : "Shipment Details"}
        action={
          <Link className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700" href="/admin/shipments">
            Back to list
          </Link>
        }
      >
        {error ? <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
        {message ? <p className="mb-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p> : null}

        {!shipment ? (
          <div className="rounded-md bg-white p-5 text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">Loading shipment...</div>
        ) : (
          <div className="grid gap-5">
            <section className="grid gap-4 rounded-md bg-white p-5 shadow-sm ring-1 ring-slate-200 md:grid-cols-4">
              <Metric label="Status" value={statusLabel(shipment.currentStatus)} />
              <Metric label="Current location" value={shipment.currentLocation ?? "Not set"} />
              <Metric label="Progress" value={`${shipment.progressPercentage}%`} />
              <Metric label="Estimated delivery" value={formatDate(shipment.estimatedDeliveryDate)} />
            </section>

            <section>
              <div className="mb-3">
                <h2 className="text-lg font-semibold text-ink">Live Position on Map</h2>
                <p className="text-sm text-slate-600">The marker rides the road route. Use the controls below to advance the timeline and watch it move.</p>
              </div>
              <RouteVisual shipment={shipment} />
            </section>

            <MovementControl
              shipment={shipment}
              busy={movementBusy}
              hoursInput={hoursInput}
              setHoursInput={setHoursInput}
              onMove={sendMovement}
            />

            <section className="rounded-md bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <h2 className="mb-4 text-lg font-semibold text-ink">Shipment Details</h2>
              <div className="grid gap-3 text-sm md:grid-cols-2 lg:grid-cols-3">
                <Info label="Sender" value={shipment.senderName} />
                <Info label="Sender address" value={shipment.senderAddress} />
                <Info label="Sender phone" value={shipment.senderPhone} />
                <Info label="Sender email" value={shipment.senderEmail} />
                <Info label="Receiver" value={shipment.receiverName} />
                <Info label="Receiver address" value={shipment.receiverAddress} />
                <Info label="Receiver phone" value={shipment.receiverPhone} />
                <Info label="Receiver email" value={shipment.receiverEmail} />
                <Info label="Origin" value={shipment.origin} />
                <Info label="Destination" value={shipment.destination} />
                <Info label="Package" value={shipment.packageDescription} />
                <Info label="Carrier" value={shipment.carrier} />
                <Info label="Shipment mode" value={shipment.shipmentMode} />
                <Info label="Weight" value={shipment.weight} />
                <Info label="Quantity" value={shipment.quantity} />
                <Info label="Payment mode" value={shipment.paymentMode} />
                <Info label="Total freight" value={shipment.totalFreight} />
                <Info label="Shipment type" value={shipment.shipmentType} />
                <Info label="Pickup date" value={formatDate(shipment.pickupDate)} />
                <Info label="Pickup time" value={shipment.pickupTime} />
                <Info label="Departure" value={formatDate(shipment.departureDate)} />
                <Info label="Departure time" value={shipment.departureTime} />
                <Info label="Actual delivery" value={formatDate(shipment.actualDeliveryDate)} />
                <Info label="Created by" value={shipment.createdBy?.email} />
              </div>
              <div className="mt-4 grid gap-3 text-sm">
                <Info label="Public note" value={shipment.publicNote} />
                <Info label="Internal admin note" value={shipment.adminNote} />
              </div>
            </section>

            <ShipmentForm shipment={shipment} onSubmit={updateShipment} submitLabel="Save shipment" />

            <section className="grid gap-5 lg:grid-cols-[1fr_420px]">
              <div className="rounded-md bg-white p-5 shadow-sm ring-1 ring-slate-200">
                <h2 className="mb-4 text-lg font-semibold text-ink">Shipment Timeline</h2>
                <div className="grid gap-3">
                  {shipment.history?.length ? (
                    shipment.history.map((entry) => (
                      <div key={entry.id} className="border-l-2 border-signal pl-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-ink">{statusLabel(entry.status)}</span>
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                            {entry.visibility}
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-slate-600">{entry.location ?? "Location not set"}</div>
                        <div className="mt-1 text-sm text-slate-700">{entry.note ?? "No note"}</div>
                        <div className="mt-1 text-xs text-slate-500">{formatDate(entry.createdAt)}</div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No history yet.</p>
                  )}
                </div>
              </div>

              <form onSubmit={addHistory} className="grid content-start gap-4 rounded-md bg-white p-5 shadow-sm ring-1 ring-slate-200">
                <h2 className="text-lg font-semibold text-ink">Add Timeline Update</h2>
                <Select name="status" label="Status" defaultValue={shipment.currentStatus} />
                <Field name="location" label="Location" defaultValue={shipment.currentLocation ?? ""} />
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Visibility
                  <select name="visibility" className="rounded-md border border-slate-300 px-3 py-2 text-base outline-none focus:border-signal">
                    <option value="public">Public</option>
                    <option value="internal">Internal</option>
                  </select>
                </label>
                <TextArea name="note" label="Note" />
                <button className="rounded-md bg-ink px-4 py-3 text-sm font-semibold text-white">Add update</button>
              </form>
            </section>
          </div>
        )}
      </AdminLayout>
    </AdminGuard>
  );
}

function MovementControl({ shipment, busy, hoursInput, setHoursInput, onMove }) {
  const movement = shipment.movement ?? {};
  const autoProgress = shipment.autoProgress !== false;
  const offsetHours = (shipment.clockOffsetMinutes ?? 0) / 60;
  const percent = Math.round((movement.fraction ?? 0) * 100);
  const distanceKm = Number.isFinite(movement.distanceM) ? (movement.distanceM / 1000).toFixed(0) : null;
  const provider = movement.provider === "osrm" ? "Road route" : movement.provider === "geodesic" ? "Direct line (routing offline)" : "—";

  function applyCustomHours() {
    const value = Number(hoursInput);
    if (!Number.isFinite(value) || value === 0) {
      return;
    }
    onMove({ advanceHours: value });
    setHoursInput("");
  }

  return (
    <section className="rounded-md bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-ink">Movement Control</h2>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            autoProgress ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
          }`}
        >
          {autoProgress ? "Auto-advancing" : "Paused (pinned)"}
        </span>
      </div>

      <div className="mb-4 grid gap-3 text-sm md:grid-cols-4">
        <Info label="Position label" value={movement.label ?? shipment.currentLocation ?? "Not set"} />
        <Info label="Along route" value={`${percent}%`} />
        <Info label="Time shift" value={offsetHours === 0 ? "Live (no shift)" : `${offsetHours > 0 ? "+" : ""}${offsetHours} h`} />
        <Info label="Route" value={distanceKm ? `${provider} · ${distanceKm} km` : provider} />
      </div>

      <p className="mb-3 text-sm text-slate-600">
        Move the package forward or back in time. Auto-advance interpolates its position along the road route between the
        departure and expected delivery times.
      </p>

      <div className="flex flex-wrap gap-2">
        <MoveButton disabled={busy} onClick={() => onMove({ advanceHours: 6 })}>+6 hours</MoveButton>
        <MoveButton disabled={busy} onClick={() => onMove({ advanceHours: 12 })}>+12 hours</MoveButton>
        <MoveButton disabled={busy} onClick={() => onMove({ advanceHours: 24 })}>+1 day</MoveButton>
        <MoveButton disabled={busy} onClick={() => onMove({ advanceHours: -6 })}>-6 hours</MoveButton>
        <MoveButton disabled={busy} onClick={() => onMove({ advanceHours: -24 })}>-1 day</MoveButton>
        <MoveButton disabled={busy} onClick={() => onMove({ reset: true })}>Reset to live</MoveButton>
        {autoProgress ? (
          <MoveButton disabled={busy} onClick={() => onMove({ autoProgress: false })}>Pause</MoveButton>
        ) : (
          <MoveButton disabled={busy} onClick={() => onMove({ autoProgress: true })}>Resume</MoveButton>
        )}
        <MoveButton disabled={busy || shipment.currentStatus === "DELIVERED"} onClick={() => onMove({ markDelivered: true })} tone="dark">
          Mark delivered
        </MoveButton>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Custom shift (hours, negative to rewind)
          <input
            type="number"
            step="any"
            value={hoursInput}
            onChange={(event) => setHoursInput(event.target.value)}
            placeholder="e.g. 8 or -3"
            className="min-h-10 w-56 rounded-md border border-slate-300 px-3 py-2 text-base outline-none focus:border-signal"
          />
        </label>
        <button
          type="button"
          disabled={busy || !hoursInput}
          onClick={applyCustomHours}
          className="min-h-10 rounded-md bg-signal px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          Apply shift
        </button>
      </div>
    </section>
  );
}

function MoveButton({ children, onClick, disabled, tone = "light" }) {
  const styles =
    tone === "dark"
      ? "bg-ink text-white hover:bg-signal"
      : "border border-slate-300 text-slate-700 hover:border-signal hover:text-signal";
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`rounded-md px-3 py-2 text-sm font-semibold disabled:opacity-60 ${styles}`}>
      {children}
    </button>
  );
}

function Metric({ label, value }) {
  return (
    <div>
      <div className="text-sm font-medium text-slate-500">{label}</div>
      <div className="mt-1 text-xl font-semibold text-ink">{value}</div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-normal text-slate-500">{label}</div>
      <div className="mt-1 text-slate-800">{value ?? "Not set"}</div>
    </div>
  );
}

function Field({ label, ...props }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      {label}
      <input className="rounded-md border border-slate-300 px-3 py-2 text-base outline-none focus:border-signal" {...props} />
    </label>
  );
}

function Select({ label, ...props }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      {label}
      <select className="rounded-md border border-slate-300 px-3 py-2 text-base outline-none focus:border-signal" {...props}>
        {shipmentStatuses.map(([value, labelText]) => (
          <option key={value} value={value}>
            {labelText}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextArea({ label, ...props }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      {label}
      <textarea className="min-h-20 rounded-md border border-slate-300 px-3 py-2 text-base outline-none focus:border-signal" {...props} />
    </label>
  );
}
