import { elapsedTimeFraction } from "./movement.js";

export function calculateShipmentProgress(shipment, nowMs = Date.now()) {
  if (shipment.currentStatus === "DELIVERED") {
    return 100;
  }

  if (shipment.currentStatus === "CANCELLED" || shipment.currentStatus === "ON_HOLD" || shipment.currentStatus === "DELAYED") {
    return shipment.progressPercentage ?? 0;
  }

  if (shipment.currentStatus === "SHIPMENT_CREATED") {
    return Math.max(5, Math.min(shipment.progressPercentage ?? 0, 5));
  }

  // Moving statuses with auto-progress paused keep their last value.
  if (shipment.autoProgress === false) {
    return shipment.progressPercentage ?? 0;
  }

  const fraction = elapsedTimeFraction(shipment, nowMs);

  if (fraction == null) {
    return shipment.progressPercentage ?? 0;
  }

  // Hold just below 100% until the shipment is marked delivered.
  return Math.max(0, Math.min(99, Math.round(fraction * 100)));
}
