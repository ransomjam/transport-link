"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";

const MAP_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const ROUTING_HOST = "router.project-osrm.org";

// Fallback gazetteer used only when a shipment has no stored coordinates or
// route geometry (legacy records). The server is the source of truth otherwise.
const LOCATION_COORDINATES = {
  "atlanta georgia": { lat: 33.749, lng: -84.388 },
  "chicago illinois": { lat: 41.8781, lng: -87.6298 },
  "cleveland ohio": { lat: 41.4993, lng: -81.6944 },
  "dallas texas": { lat: 32.7767, lng: -96.797 },
  "edmonton canada": { lat: 53.5461, lng: -113.4938 },
  "garden city ks": { lat: 37.9717, lng: -100.8727 },
  "garden city kansas": { lat: 37.9717, lng: -100.8727 },
  "houston texas": { lat: 29.7604, lng: -95.3698 },
  "midwest city oklahoma": { lat: 35.4495, lng: -97.3967 }
};

const POINT_STYLES = {
  origin: { color: "#049DBF", shortLabel: "O" },
  current: { color: "#0AA66D", shortLabel: "L" },
  destination: { color: "#0F2742", shortLabel: "D" }
};

export default function EstimatedRouteMap({ shipment }) {
  const endpoints = useMemo(() => resolveEndpoints(shipment), [shipment]);
  const storedGeometry = useMemo(() => normalizeGeometry(shipment?.routeGeometry), [shipment?.routeGeometry]);

  // The route polyline: prefer the server-computed road route, otherwise fetch
  // a road route between the two endpoints, otherwise a straight line.
  const [fetchedRoute, setFetchedRoute] = useState({ status: "idle", positions: [] });
  const endpointKey = useMemo(() => endpointsKey(endpoints), [endpoints]);

  useEffect(() => {
    if (storedGeometry.length > 1) {
      setFetchedRoute({ status: "idle", positions: [] });
      return undefined;
    }

    if (!endpoints.origin || !endpoints.destination) {
      setFetchedRoute({ status: "idle", positions: [] });
      return undefined;
    }

    const cached = readCachedRoadRoute(endpointKey);
    if (cached.length) {
      setFetchedRoute({ status: "ready", positions: cached });
      return undefined;
    }

    const controller = new AbortController();
    setFetchedRoute({ status: "loading", positions: [] });

    loadRoadRoute([endpoints.origin, endpoints.destination], controller.signal)
      .then((positions) => {
        writeCachedRoadRoute(endpointKey, positions);
        setFetchedRoute({ status: positions.length ? "ready" : "unavailable", positions });
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          setFetchedRoute({ status: "unavailable", positions: [] });
        }
      });

    return () => controller.abort();
  }, [endpointKey, storedGeometry.length]);

  const routeLine = useMemo(() => {
    if (storedGeometry.length > 1) {
      return storedGeometry;
    }
    if (fetchedRoute.positions.length > 1) {
      return fetchedRoute.positions;
    }
    if (endpoints.origin && endpoints.destination) {
      return [endpoints.origin, endpoints.destination];
    }
    return [];
  }, [storedGeometry, fetchedRoute.positions, endpoints]);

  // Live position of the package, animated client-side from the server window.
  const liveFraction = useLiveFraction(shipment?.movement);
  const currentPos = useMemo(
    () => resolveCurrentPosition(shipment, routeLine, liveFraction, endpoints),
    [shipment, routeLine, liveFraction, endpoints]
  );

  const summaries = useMemo(() => buildSummaries(shipment), [shipment]);
  const markers = useMemo(
    () => buildMarkers(endpoints, currentPos, summaries),
    [endpoints, currentPos, summaries]
  );

  const boundsPositions = useMemo(() => {
    const points = [...routeLine];
    if (currentPos) {
      points.push(currentPos);
    }
    return points;
  }, [routeLine, currentPos]);

  if (!markers.length) {
    return <FallbackRouteCard summaries={summaries} />;
  }

  const center = boundsPositions[0] ?? [39.5, -98.35];

  return (
    <div className="space-y-4">
      <div className="h-[360px] overflow-hidden rounded-md bg-slate-100 ring-1 ring-slate-200 md:h-[420px]">
        <MapContainer center={center} zoom={6} className="h-full w-full" preferCanvas scrollWheelZoom={false} attributionControl={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url={MAP_TILE_URL}
            updateWhenIdle={false}
            updateWhenZooming={false}
          />
          <FitMapToRoute positions={boundsPositions} />
          {routeLine.length > 1 ? (
            <>
              <Polyline positions={routeLine} pathOptions={{ color: "#ffffff", opacity: 0.98, weight: 10 }} />
              <Polyline positions={routeLine} pathOptions={{ color: "#1A73E8", opacity: 0.96, weight: 6 }} />
            </>
          ) : null}
          {markers.map((point) => (
            <Marker key={point.key} icon={createMarkerIcon(point)} position={point.position}>
              <Popup>
                <div className="min-w-32">
                  <div className="text-xs font-semibold uppercase tracking-normal text-slate-500">{point.label}</div>
                  <div className="mt-1 font-semibold text-[#0F2742]">{point.value}</div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {fetchedRoute.status === "unavailable" && routeLine.length > 1 ? (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-amber-200">
          Showing a direct route line; the detailed road route is temporarily unavailable.
        </p>
      ) : null}

      <RouteSummary summaries={summaries} />

      <a
        className="inline-flex w-fit text-sm font-semibold text-[#049DBF] transition hover:text-[#0F2742]"
        href={openStreetMapHref(currentPos ?? endpoints.origin ?? endpoints.destination)}
        target="_blank"
        rel="noreferrer"
      >
        Open full map
      </a>
    </div>
  );
}

// Recompute the journey fraction every second from the server-provided window
// so the marker glides along the route in real time between data refreshes.
function useLiveFraction(movement) {
  const [fraction, setFraction] = useState(() => (movement ? clamp01(movement.fraction ?? 0) : 0));
  // Offset between the client clock and the server clock, captured once.
  const skewRef = useRef(0);

  useEffect(() => {
    if (!movement) {
      return undefined;
    }

    if (Number.isFinite(movement.serverNowMs)) {
      skewRef.current = movement.serverNowMs - Date.now();
    }

    const compute = () => {
      const { effectiveDepartureMs, effectiveEtaMs, animating } = movement;
      if (!animating || !Number.isFinite(effectiveDepartureMs) || !Number.isFinite(effectiveEtaMs) || effectiveEtaMs <= effectiveDepartureMs) {
        return clamp01(movement.fraction ?? 0);
      }
      const serverNow = Date.now() + skewRef.current;
      return clamp01((serverNow - effectiveDepartureMs) / (effectiveEtaMs - effectiveDepartureMs));
    };

    setFraction(compute());

    if (!movement.animating) {
      return undefined;
    }

    const timer = setInterval(() => setFraction(compute()), 1000);
    return () => clearInterval(timer);
  }, [movement]);

  return fraction;
}

function resolveCurrentPosition(shipment, routeLine, liveFraction, endpoints) {
  const movement = shipment?.movement;

  // Auto-progressing shipments are placed along the route at the live fraction.
  if (movement?.animating && routeLine.length > 1) {
    return pointAtFraction(routeLine, liveFraction);
  }

  // Otherwise use the server-computed position when available.
  const fromServer = toPosition(movement?.lat, movement?.lng) ?? toPosition(shipment?.currentLocationLat, shipment?.currentLocationLng);
  if (fromServer) {
    return fromServer;
  }

  if (routeLine.length > 1) {
    return pointAtFraction(routeLine, clamp01(movement?.fraction ?? 0));
  }

  if (endpoints.origin && endpoints.destination) {
    return lerp(endpoints.origin, endpoints.destination, clamp01(movement?.fraction ?? 0));
  }

  return null;
}

function FitMapToRoute({ positions }) {
  const map = useMap();

  useEffect(() => {
    if (!positions.length) {
      return;
    }

    if (positions.length === 1) {
      map.setView(positions[0], 7);
      return;
    }

    map.fitBounds(L.latLngBounds(positions), { maxZoom: 8, padding: [48, 48] });
  }, [map, positions]);

  return null;
}

function FallbackRouteCard({ summaries }) {
  return (
    <div className="rounded-md bg-[#F5F8FA] p-4 ring-1 ring-slate-200">
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-normal text-slate-500">
        <span>Shipment Route</span>
        <span aria-hidden="true">&rarr;</span>
        <span>Last Updated Location</span>
      </div>

      <RouteSummary summaries={summaries} className="mt-4" />

      <p className="mt-4 text-sm leading-6 text-slate-600">Map route is based on available shipment information.</p>
    </div>
  );
}

function RouteSummary({ summaries, className = "" }) {
  return (
    <div className={`grid gap-3 md:grid-cols-3 ${className}`}>
      {summaries.map((summary) => (
        <div key={summary.key} className="rounded-md bg-white p-3 shadow-sm ring-1 ring-slate-200">
          <span className="mb-2 block h-3 w-3 rounded-full" style={{ backgroundColor: summary.color }} />
          <span className="block text-xs font-semibold uppercase tracking-normal text-slate-500">{summary.label}</span>
          <span className="mt-1 block text-sm font-semibold text-[#0F2742]">{summary.value || "Not set"}</span>
        </div>
      ))}
    </div>
  );
}

function buildSummaries(shipment) {
  return [
    createSummary("origin", "Origin", shipment?.origin),
    createSummary("current", "Last Updated Location", shipment?.currentLocation),
    createSummary("destination", "Destination", shipment?.destination)
  ];
}

function createSummary(key, label, value) {
  return {
    key,
    label,
    value,
    color: POINT_STYLES[key].color,
    shortLabel: POINT_STYLES[key].shortLabel
  };
}

function buildMarkers(endpoints, currentPos, summaries) {
  const byKey = Object.fromEntries(summaries.map((summary) => [summary.key, summary]));
  const markers = [];

  if (endpoints.origin) {
    markers.push({ ...byKey.origin, position: endpoints.origin });
  }
  if (endpoints.destination) {
    markers.push({ ...byKey.destination, position: endpoints.destination });
  }
  // Draw the current-location marker last so it sits above the endpoints.
  if (currentPos) {
    markers.push({ ...byKey.current, position: currentPos });
  }

  return markers;
}

function resolveEndpoints(shipment) {
  const geometry = normalizeGeometry(shipment?.routeGeometry);

  const origin =
    toPosition(shipment?.originLat, shipment?.originLng) ??
    (geometry.length ? geometry[0] : null) ??
    lookupCoordinate(shipment?.origin);

  const destination =
    toPosition(shipment?.destinationLat, shipment?.destinationLng) ??
    (geometry.length ? geometry[geometry.length - 1] : null) ??
    lookupCoordinate(shipment?.destination);

  return { origin, destination };
}

function normalizeGeometry(geometry) {
  if (!Array.isArray(geometry)) {
    return [];
  }
  return geometry
    .map((point) => (Array.isArray(point) ? toPosition(point[0], point[1]) : null))
    .filter(Boolean);
}

function toPosition(latValue, lngValue) {
  // Treat null/undefined/empty as "no coordinate" — Number(null) is 0, which
  // would otherwise validate as a real point off the coast of Africa.
  if (latValue === null || latValue === undefined || latValue === "" || lngValue === null || lngValue === undefined || lngValue === "") {
    return null;
  }
  const lat = Number(latValue);
  const lng = Number(lngValue);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return null;
  }
  return [lat, lng];
}

function clamp01(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return 0;
  }
  return Math.max(0, Math.min(1, n));
}

function lerp(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

function haversine(a, b) {
  const toRad = (v) => (v * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.min(1, Math.sqrt(h)));
}

// Point that lies `fraction` of the way along a polyline by arc length.
function pointAtFraction(points, fraction) {
  if (!points.length) {
    return null;
  }
  if (points.length === 1) {
    return points[0];
  }

  const t = clamp01(fraction);
  const distances = [0];
  for (let i = 1; i < points.length; i += 1) {
    distances[i] = distances[i - 1] + haversine(points[i - 1], points[i]);
  }
  const total = distances[distances.length - 1];
  if (total === 0) {
    return points[0];
  }
  if (t <= 0) {
    return points[0];
  }
  if (t >= 1) {
    return points[points.length - 1];
  }

  const target = t * total;
  let segment = 1;
  while (segment < distances.length - 1 && distances[segment] < target) {
    segment += 1;
  }
  const segStart = distances[segment - 1];
  const segLen = distances[segment] - segStart;
  const localT = segLen === 0 ? 0 : (target - segStart) / segLen;
  return lerp(points[segment - 1], points[segment], localT);
}

async function loadRoadRoute(positions, signal) {
  const coordinates = positions.map(([lat, lng]) => `${lng},${lat}`).join(";");
  const params = new URLSearchParams({
    overview: "full",
    geometries: "geojson",
    steps: "false",
    alternatives: "false",
    continue_straight: "true"
  });
  const response = await fetch(`${getRoutingEndpoint()}/${coordinates}?${params}`, { signal });

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  const route = data.routes?.[0]?.geometry?.coordinates;

  if (!Array.isArray(route)) {
    return [];
  }

  return route.map(([lng, lat]) => toPosition(lat, lng)).filter(Boolean);
}

function getRoutingEndpoint() {
  const protocol = typeof window !== "undefined" && window.location.protocol === "https:" ? "https" : "http";
  return `${protocol}://${ROUTING_HOST}/route/v1/driving`;
}

function readCachedRoadRoute(routeKey) {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const cached = JSON.parse(window.localStorage.getItem(`road-route:${routeKey}`) ?? "[]");
    if (!Array.isArray(cached)) {
      return [];
    }
    return cached.filter((position) => Array.isArray(position) && position.length === 2 && position.every(Number.isFinite));
  } catch {
    return [];
  }
}

function writeCachedRoadRoute(routeKey, positions) {
  if (typeof window === "undefined" || positions.length < 2) {
    return;
  }

  try {
    window.localStorage.setItem(`road-route:${routeKey}`, JSON.stringify(positions));
  } catch {
    // The map still works if storage is unavailable.
  }
}

function endpointsKey(endpoints) {
  const fmt = (p) => (p ? `${p[0].toFixed(5)},${p[1].toFixed(5)}` : "-");
  return `${fmt(endpoints.origin)}|${fmt(endpoints.destination)}`;
}

function lookupCoordinate(location) {
  const normalized = normalizeLocationName(location);
  if (!normalized) {
    return null;
  }
  if (LOCATION_COORDINATES[normalized]) {
    const { lat, lng } = LOCATION_COORDINATES[normalized];
    return [lat, lng];
  }
  const match = Object.entries(LOCATION_COORDINATES).find(([key]) => normalized.includes(key) || key.includes(normalized));
  return match ? [match[1].lat, match[1].lng] : null;
}

function normalizeLocationName(location) {
  return String(location ?? "")
    .toLowerCase()
    .replace(/\b(united states|usa|us)\b/g, "")
    .replace(/\b(oklahoma city)\b/g, "oklahoma")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function createMarkerIcon(point) {
  return L.divIcon({
    className: "",
    html: `<span style="align-items:center;background:${point.color};border:3px solid #fff;border-radius:9999px;box-shadow:0 10px 24px rgba(15,39,66,.24);color:#fff;display:flex;font-size:13px;font-weight:700;height:34px;justify-content:center;width:34px;">${point.shortLabel}</span>`,
    iconAnchor: [17, 17],
    iconSize: [34, 34],
    popupAnchor: [0, -18]
  });
}

function openStreetMapHref(position) {
  if (!position) {
    return "https://www.openstreetmap.org/";
  }
  const [lat, lng] = position;
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=7/${lat}/${lng}`;
}
