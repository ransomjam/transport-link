"use client";

import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";

const MAP_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const ROUTING_HOST = "router.project-osrm.org";

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

const COORDINATE_FIELDS = {
  origin: {
    objects: ["originCoordinates", "originCoordinate", "originCoords", "originLocation"],
    pairs: [
      ["originLatitude", "originLongitude"],
      ["originLat", "originLng"],
      ["originLat", "originLon"]
    ]
  },
  current: {
    objects: [
      "currentLocationCoordinates",
      "currentLocationCoordinate",
      "currentCoordinates",
      "currentCoordinate",
      "lastUpdatedLocationCoordinates",
      "lastUpdatedLocationCoordinate",
      "lastLocationCoordinates"
    ],
    pairs: [
      ["currentLocationLat", "currentLocationLng"],
      ["currentLatitude", "currentLongitude"],
      ["currentLat", "currentLng"],
      ["currentLat", "currentLon"],
      ["lastUpdatedLatitude", "lastUpdatedLongitude"],
      ["lastUpdatedLat", "lastUpdatedLng"],
      ["lastLocationLat", "lastLocationLng"]
    ]
  },
  destination: {
    objects: ["destinationCoordinates", "destinationCoordinate", "destinationCoords", "destinationLocation"],
    pairs: [
      ["destinationLatitude", "destinationLongitude"],
      ["destinationLat", "destinationLng"],
      ["destinationLat", "destinationLon"]
    ]
  }
};

export default function EstimatedRouteMap({ shipment }) {
  const route = useMemo(() => buildRoute(shipment), [shipment]);
  const routeLine = useMemo(() => route.points.map((point) => point.position), [route.points]);
  const markerPoints = useMemo(() => [...route.points].sort((a, b) => (a.key === "current" ? 1 : b.key === "current" ? -1 : 0)), [route.points]);
  const routeKey = useMemo(() => routeLine.map(([lat, lng]) => `${lat.toFixed(5)},${lng.toFixed(5)}`).join("|"), [routeLine]);
  const [roadRoute, setRoadRoute] = useState({ status: "idle", positions: [] });
  const center = useMemo(() => getCenter(route.points), [route.points]);
  const mapBoundsPositions = roadRoute.positions.length ? roadRoute.positions : routeLine;

  useEffect(() => {
    const waypoints = uniquePositions(routeLine);

    if (waypoints.length < 2) {
      setRoadRoute({ status: "idle", positions: [] });
      return;
    }

    const cachedRoute = readCachedRoadRoute(routeKey);

    if (cachedRoute.length) {
      setRoadRoute({ status: "ready", positions: cachedRoute });
      return;
    }

    const controller = new AbortController();
    setRoadRoute({ status: "loading", positions: [] });

    loadRoadRoute(waypoints, controller.signal)
      .then((positions) => {
        writeCachedRoadRoute(routeKey, positions);
        setRoadRoute({ status: positions.length ? "ready" : "unavailable", positions });
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          setRoadRoute({ status: "unavailable", positions: [] });
        }
      });

    return () => controller.abort();
  }, [routeKey]);

  if (!route.points.length) {
    return <FallbackRouteCard summaries={route.summaries} />;
  }

  return (
    <div className="space-y-4">
      <div className="h-[360px] overflow-hidden rounded-md bg-slate-100 ring-1 ring-slate-200 md:h-[420px]">
        <MapContainer center={center} zoom={route.points.length > 1 ? 6 : 7} className="h-full w-full" preferCanvas scrollWheelZoom={false} attributionControl={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url={MAP_TILE_URL}
            updateWhenIdle={false}
            updateWhenZooming={false}
          />
          <FitMapToRoute positions={mapBoundsPositions} />
          {roadRoute.positions.length > 1 ? (
            <>
              <Polyline positions={roadRoute.positions} pathOptions={{ color: "#ffffff", opacity: 0.98, weight: 10 }} />
              <Polyline positions={roadRoute.positions} pathOptions={{ color: "#1A73E8", opacity: 0.96, weight: 6 }} />
            </>
          ) : null}
          {markerPoints.map((point) => (
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

      {roadRoute.status === "unavailable" && routeLine.length > 1 ? (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-amber-200">
          Estimated road route is unavailable for these coordinates right now.
        </p>
      ) : null}

      <RouteSummary summaries={route.summaries} />

      <a
        className="inline-flex w-fit text-sm font-semibold text-[#049DBF] transition hover:text-[#0F2742]"
        href={openStreetMapHref(route.points)}
        target="_blank"
        rel="noreferrer"
      >
        Open full map
      </a>
    </div>
  );
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

function buildRoute(shipment) {
  const summaries = [
    createSummary("origin", "Origin", shipment.origin),
    createSummary("current", "Last Updated Location", shipment.currentLocation),
    createSummary("destination", "Destination", shipment.destination)
  ];

  const points = summaries
    .map((summary) => {
      const coordinate = getShipmentCoordinate(shipment, summary.key);

      if (!coordinate) {
        return null;
      }

      return {
        ...summary,
        position: [coordinate.lat, coordinate.lng]
      };
    })
    .filter(Boolean);

  return { points, summaries };
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

function getShipmentCoordinate(shipment, pointKey) {
  const fields = COORDINATE_FIELDS[pointKey];

  for (const field of fields.objects) {
    const coordinate = normalizeCoordinate(shipment?.[field]);

    if (coordinate) {
      return coordinate;
    }
  }

  for (const [latField, lngField] of fields.pairs) {
    const coordinate = toCoordinate(shipment?.[latField], shipment?.[lngField]);

    if (coordinate) {
      return coordinate;
    }
  }

  return lookupCoordinate(getLocationLabel(shipment, pointKey));
}

function normalizeCoordinate(value) {
  if (!value) {
    return null;
  }

  if (Array.isArray(value)) {
    return toCoordinate(value[0], value[1]);
  }

  if (typeof value !== "object") {
    return null;
  }

  if (value.type === "Point" && Array.isArray(value.coordinates)) {
    return toCoordinate(value.coordinates[1], value.coordinates[0]);
  }

  if (Array.isArray(value.coordinates)) {
    return toCoordinate(value.coordinates[0], value.coordinates[1]);
  }

  return toCoordinate(value.lat ?? value.latitude, value.lng ?? value.lon ?? value.longitude);
}

function toCoordinate(latValue, lngValue) {
  const lat = Number(latValue);
  const lng = Number(lngValue);

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return null;
  }

  return { lat, lng };
}

async function loadRoadRoute(positions, signal) {
  const coordinates = positions.map(([lat, lng]) => `${lng},${lat}`).join(";");
  const params = new URLSearchParams({
    overview: "full",
    geometries: "geojson",
    steps: "false",
    alternatives: "false",
    continue_straight: "false"
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

  return route
    .map(([lng, lat]) => toCoordinate(lat, lng))
    .filter(Boolean)
    .map((point) => [point.lat, point.lng]);
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

function uniquePositions(positions) {
  const seen = new Set();

  return positions.filter(([lat, lng]) => {
    const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function getLocationLabel(shipment, pointKey) {
  if (pointKey === "origin") {
    return shipment?.origin;
  }

  if (pointKey === "destination") {
    return shipment?.destination;
  }

  return shipment?.currentLocation;
}

function lookupCoordinate(location) {
  const normalized = normalizeLocationName(location);

  if (!normalized) {
    return null;
  }

  if (LOCATION_COORDINATES[normalized]) {
    return LOCATION_COORDINATES[normalized];
  }

  const match = Object.entries(LOCATION_COORDINATES).find(([key]) => normalized.includes(key) || key.includes(normalized));
  return match?.[1] ?? null;
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

function getCenter(points) {
  if (!points.length) {
    return [39.5, -98.35];
  }

  const totals = points.reduce(
    (sum, point) => ({
      lat: sum.lat + point.position[0],
      lng: sum.lng + point.position[1]
    }),
    { lat: 0, lng: 0 }
  );

  return [totals.lat / points.length, totals.lng / points.length];
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

function openStreetMapHref(points) {
  const point = points.find((item) => item.key === "current") ?? points[0];
  const [lat, lng] = point.position;

  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=7/${lat}/${lng}`;
}
