// The movement engine: turns elapsed time into a position along a shipment's
// stored route. Position is computed on read (stateless), so tracking is always
// accurate to the second without a background job. Admins nudge the timeline via
// `clockOffsetMinutes` and freeze it with `autoProgress`.

import {
  interpolateGreatCircle,
  isValidCoordinate,
  nearestPlaceLabel,
  pointAtFraction
} from "./geo.js";

// Statuses where the package is actively moving between origin and destination.
const MOVING_STATUSES = new Set([
  "PICKED_UP",
  "IN_TRANSIT",
  "AT_SORTING_FACILITY",
  "ARRIVED_AT_DESTINATION_CITY",
  "OUT_FOR_DELIVERY"
]);

// Statuses where progress is paused at its last value.
const FROZEN_STATUSES = new Set(["ON_HOLD", "DELAYED", "CANCELLED"]);

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function storedFraction(shipment) {
  return clamp01((Number(shipment.progressPercentage) || 0) / 100);
}

// The effective departure/ETA window (epoch ms) after applying the admin clock
// offset. Folding the offset into the window keeps it out of public payloads
// while still letting the client animate smoothly between reads.
export function effectiveWindow(shipment) {
  const offsetMs = (Number(shipment.clockOffsetMinutes) || 0) * 60000;
  const departure = new Date(shipment.departureDate).getTime();
  const eta = new Date(shipment.estimatedDeliveryDate).getTime();
  return {
    effectiveDepartureMs: Number.isFinite(departure) ? departure - offsetMs : null,
    effectiveEtaMs: Number.isFinite(eta) ? eta - offsetMs : null
  };
}

// Raw 0..1 fraction of the journey by elapsed time, with the admin clock offset
// applied. Independent of status.
export function elapsedTimeFraction(shipment, nowMs = Date.now()) {
  const { effectiveDepartureMs, effectiveEtaMs } = effectiveWindow(shipment);
  if (effectiveDepartureMs == null || effectiveEtaMs == null) {
    return null;
  }
  const total = effectiveEtaMs - effectiveDepartureMs;
  if (total <= 0) {
    return null;
  }
  return clamp01((nowMs - effectiveDepartureMs) / total);
}

// The fraction used to place the package, honouring status and autoProgress.
export function movementFraction(shipment, nowMs = Date.now()) {
  const status = shipment.currentStatus;

  if (status === "DELIVERED") {
    return 1;
  }
  if (status === "SHIPMENT_CREATED") {
    return 0;
  }
  if (FROZEN_STATUSES.has(status)) {
    return storedFraction(shipment);
  }

  // Moving statuses: advance with time unless the admin pinned progress.
  if (shipment.autoProgress === false) {
    return storedFraction(shipment);
  }

  const elapsed = elapsedTimeFraction(shipment, nowMs);
  return elapsed == null ? storedFraction(shipment) : elapsed;
}

function getRouteGeometry(shipment) {
  const geometry = shipment.routeGeometry;
  if (!Array.isArray(geometry) || geometry.length < 2) {
    return null;
  }
  return geometry;
}

function manualPosition(shipment) {
  const lat = Number(shipment.currentLocationLat);
  const lng = Number(shipment.currentLocationLng);
  return isValidCoordinate(lat, lng) ? { lat, lng } : null;
}

function endpointPosition(shipment, key) {
  const lat = Number(shipment[`${key}Lat`]);
  const lng = Number(shipment[`${key}Lng`]);
  return isValidCoordinate(lat, lng) ? { lat, lng } : null;
}

// Human-readable label for a moving package. When auto-progress is paused we
// keep the admin's text; otherwise we derive it from the route position so it
// never shows a stale location (e.g. the sender's city) while in transit.
function movingLabel(shipment, lat, lng, fraction, autoProgress) {
  if (!autoProgress) {
    return shipment.currentLocation ?? null;
  }
  if (fraction <= 0.001 && shipment.origin) {
    return shipment.origin;
  }
  if (fraction >= 0.999 && shipment.destination) {
    return shipment.destination;
  }
  return nearestPlaceLabel(lat, lng) ?? "In transit";
}

// Resolve the package's current position and a human label for it.
export function computeCurrentPosition(shipment, nowMs = Date.now()) {
  const fraction = movementFraction(shipment, nowMs);
  const autoProgress = shipment.autoProgress !== false;

  // When auto-progress is off, an explicit pinned location wins.
  if (!autoProgress) {
    const pinned = manualPosition(shipment);
    if (pinned) {
      return { fraction, lat: pinned.lat, lng: pinned.lng, label: shipment.currentLocation ?? null, source: "manual" };
    }
  }

  const geometry = getRouteGeometry(shipment);
  if (geometry) {
    const point = pointAtFraction(geometry, fraction);
    if (point) {
      const [lat, lng] = point;
      return { fraction, lat, lng, label: movingLabel(shipment, lat, lng, fraction, autoProgress), source: "route" };
    }
  }

  // No stored route: interpolate the straight line between endpoints.
  const origin = endpointPosition(shipment, "origin");
  const destination = endpointPosition(shipment, "destination");
  if (origin && destination) {
    const [lat, lng] = interpolateGreatCircle([origin.lat, origin.lng], [destination.lat, destination.lng], fraction);
    return { fraction, lat, lng, label: movingLabel(shipment, lat, lng, fraction, autoProgress), source: "interpolated" };
  }

  // Last resort: whatever location was stored.
  const pinned = manualPosition(shipment);
  if (pinned) {
    return { fraction, lat: pinned.lat, lng: pinned.lng, label: shipment.currentLocation ?? null, source: "manual" };
  }

  return { fraction, lat: null, lng: null, label: shipment.currentLocation ?? null, source: "none" };
}

// The compact movement payload sent to clients so they can animate the marker
// live between reads.
export function buildMovementPayload(shipment, nowMs = Date.now()) {
  const position = computeCurrentPosition(shipment, nowMs);
  const { effectiveDepartureMs, effectiveEtaMs } = effectiveWindow(shipment);
  const autoProgress = shipment.autoProgress !== false;
  const animating = autoProgress && MOVING_STATUSES.has(shipment.currentStatus);

  return {
    fraction: position.fraction,
    lat: position.lat,
    lng: position.lng,
    label: position.label,
    source: position.source,
    autoProgress,
    animating,
    effectiveDepartureMs,
    effectiveEtaMs,
    serverNowMs: nowMs,
    distanceM: Number.isFinite(shipment.routeDistanceM) ? shipment.routeDistanceM : null,
    durationS: Number.isFinite(shipment.routeDurationS) ? shipment.routeDurationS : null,
    provider: shipment.routeProvider ?? null
  };
}

export { MOVING_STATUSES };
