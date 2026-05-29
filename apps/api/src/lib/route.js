// Builds and stores the road route a shipment is expected to follow.
//
// The route is computed once (origin -> destination) from an OSRM-compatible
// routing server and cached on the shipment as a polyline. The package's live
// position is later interpolated along this polyline, so the moving marker
// always sits on a real road and never detours through an off-corridor point.
//
// If the routing server is unreachable, we fall back to a sampled great-circle
// arc so the feature degrades gracefully instead of breaking.

import { env } from "../config/env.js";
import {
  isValidCoordinate,
  lookupPlace,
  polylineLength,
  sampleGreatCircle,
  toLatLng
} from "./geo.js";

// Resolve an endpoint coordinate from explicit lat/lng, falling back to the
// gazetteer using the free-text label.
export function resolveEndpoint(lat, lng, label) {
  return toLatLng(lat, lng) ?? lookupPlace(label);
}

async function fetchOsrmRoute(start, end, signal) {
  const coords = `${start.lng},${start.lat};${end.lng},${end.lat}`;
  const params = new URLSearchParams({
    overview: "full",
    geometries: "geojson",
    steps: "false",
    alternatives: "false",
    continue_straight: "true"
  });
  const url = `${env.OSRM_URL.replace(/\/$/, "")}/route/v1/driving/${coords}?${params}`;

  const response = await fetch(url, { signal, headers: { "User-Agent": "goods-tracking/1.0" } });
  if (!response.ok) {
    throw new Error(`Routing server responded with ${response.status}`);
  }

  const data = await response.json();
  const route = data?.routes?.[0];
  const coordinates = route?.geometry?.coordinates;

  if (!Array.isArray(coordinates) || coordinates.length < 2) {
    throw new Error("Routing server returned no usable geometry");
  }

  // OSRM returns [lng, lat]; store as [lat, lng].
  const geometry = coordinates
    .map(([lng, lat]) => [lat, lng])
    .filter(([lat, lng]) => isValidCoordinate(lat, lng));

  if (geometry.length < 2) {
    throw new Error("Routing server geometry was invalid");
  }

  return {
    geometry,
    distanceM: Number.isFinite(route.distance) ? route.distance : polylineLength(geometry),
    durationS: Number.isFinite(route.duration) ? route.duration : null,
    provider: "osrm"
  };
}

function geodesicRoute(start, end) {
  const geometry = sampleGreatCircle([start.lat, start.lng], [end.lat, end.lng], 48);
  return {
    geometry,
    distanceM: polylineLength(geometry),
    durationS: null,
    provider: "geodesic"
  };
}

// Build the route between two resolved endpoints. Always returns a usable
// result: a road route when the provider is reachable, otherwise a geodesic arc.
export async function buildRoute(start, end) {
  if (!start || !end || !isValidCoordinate(start.lat, start.lng) || !isValidCoordinate(end.lat, end.lng)) {
    return null;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), env.ROUTE_TIMEOUT_MS);

  try {
    return await fetchOsrmRoute(start, end, controller.signal);
  } catch (error) {
    if (process.env.NODE_ENV !== "test") {
      console.warn(`[route] road routing unavailable, using geodesic fallback: ${error.message}`);
    }
    return geodesicRoute(start, end);
  } finally {
    clearTimeout(timer);
  }
}

// Decide whether the cached route must be rebuilt: when it is missing, or when
// either endpoint coordinate has moved.
export function routeNeedsRebuild(existing, next) {
  if (!existing?.routeGeometry || !Array.isArray(existing.routeGeometry) || existing.routeGeometry.length < 2) {
    return true;
  }

  const fields = ["originLat", "originLng", "destinationLat", "destinationLng"];
  return fields.some((field) => {
    const before = existing[field];
    const after = next[field];
    if (before == null && after == null) {
      return false;
    }
    return Number(before) !== Number(after);
  });
}
