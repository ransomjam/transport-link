// Geospatial helpers shared by the route builder and the movement engine.
// All polylines are arrays of [lat, lng] pairs.

const EARTH_RADIUS_M = 6371000;

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function toDegrees(value) {
  return (value * 180) / Math.PI;
}

export function isValidCoordinate(lat, lng) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
  );
}

// Great-circle distance in metres between two [lat, lng] points.
export function haversineMeters([lat1, lng1], [lat2, lng2]) {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(a)));
}

// Cumulative distance (metres) at each vertex of a polyline.
export function cumulativeDistances(points) {
  const distances = [0];
  for (let i = 1; i < points.length; i += 1) {
    distances[i] = distances[i - 1] + haversineMeters(points[i - 1], points[i]);
  }
  return distances;
}

// Total length of a polyline in metres.
export function polylineLength(points) {
  if (!Array.isArray(points) || points.length < 2) {
    return 0;
  }
  const distances = cumulativeDistances(points);
  return distances[distances.length - 1];
}

// Spherical interpolation between two points (t in 0..1).
export function interpolateGreatCircle([lat1, lng1], [lat2, lng2], t) {
  const phi1 = toRadians(lat1);
  const phi2 = toRadians(lat2);
  const lambda1 = toRadians(lng1);
  const lambda2 = toRadians(lng2);

  const d =
    2 *
    Math.asin(
      Math.min(
        1,
        Math.sqrt(
          Math.sin((phi2 - phi1) / 2) ** 2 +
            Math.cos(phi1) * Math.cos(phi2) * Math.sin((lambda2 - lambda1) / 2) ** 2
        )
      )
    );

  if (d === 0) {
    return [lat1, lng1];
  }

  const a = Math.sin((1 - t) * d) / Math.sin(d);
  const b = Math.sin(t * d) / Math.sin(d);
  const x = a * Math.cos(phi1) * Math.cos(lambda1) + b * Math.cos(phi2) * Math.cos(lambda2);
  const y = a * Math.cos(phi1) * Math.sin(lambda1) + b * Math.cos(phi2) * Math.sin(lambda2);
  const z = a * Math.sin(phi1) + b * Math.sin(phi2);

  return [toDegrees(Math.atan2(z, Math.sqrt(x * x + y * y))), toDegrees(Math.atan2(y, x))];
}

// Sample a great-circle arc between two endpoints into `segments + 1` points.
// Used as the offline fallback when a road-routing provider is unavailable.
export function sampleGreatCircle(start, end, segments = 48) {
  const count = Math.max(2, segments);
  const points = [];
  for (let i = 0; i <= count; i += 1) {
    points.push(interpolateGreatCircle(start, end, i / count));
  }
  return points;
}

// Point that lies `fraction` (0..1) of the way along a polyline by arc length.
export function pointAtFraction(points, fraction) {
  if (!Array.isArray(points) || points.length === 0) {
    return null;
  }
  if (points.length === 1) {
    return points[0];
  }

  const clamped = Math.max(0, Math.min(1, fraction));
  const distances = cumulativeDistances(points);
  const total = distances[distances.length - 1];

  if (total === 0) {
    return points[0];
  }
  if (clamped <= 0) {
    return points[0];
  }
  if (clamped >= 1) {
    return points[points.length - 1];
  }

  const target = clamped * total;
  let segment = 1;
  while (segment < distances.length - 1 && distances[segment] < target) {
    segment += 1;
  }

  const segmentStart = distances[segment - 1];
  const segmentEnd = distances[segment];
  const segmentLength = segmentEnd - segmentStart;
  const localT = segmentLength === 0 ? 0 : (target - segmentStart) / segmentLength;

  const [lat1, lng1] = points[segment - 1];
  const [lat2, lng2] = points[segment];
  return [lat1 + (lat2 - lat1) * localT, lng1 + (lng2 - lng1) * localT];
}

// Compact gazetteer of major North American hubs, used to (a) resolve an
// origin/destination when explicit coordinates were not supplied and (b) label
// the moving package with the nearest known place name.
export const GAZETTEER = [
  { label: "New York, NY", lat: 40.7128, lng: -74.006 },
  { label: "Newark, NJ", lat: 40.7357, lng: -74.1724 },
  { label: "Philadelphia, PA", lat: 39.9526, lng: -75.1652 },
  { label: "Pittsburgh, PA", lat: 40.4406, lng: -79.9959 },
  { label: "Washington, DC", lat: 38.9072, lng: -77.0369 },
  { label: "Baltimore, MD", lat: 39.2904, lng: -76.6122 },
  { label: "Boston, MA", lat: 42.3601, lng: -71.0589 },
  { label: "Buffalo, NY", lat: 42.8864, lng: -78.8784 },
  { label: "Cleveland, Ohio", lat: 41.4993, lng: -81.6944 },
  { label: "Columbus, Ohio", lat: 39.9612, lng: -82.9988 },
  { label: "Cincinnati, Ohio", lat: 39.1031, lng: -84.512 },
  { label: "Detroit, MI", lat: 42.3314, lng: -83.0458 },
  { label: "Indianapolis, IN", lat: 39.7684, lng: -86.1581 },
  { label: "Chicago, Illinois", lat: 41.8781, lng: -87.6298 },
  { label: "Milwaukee, WI", lat: 43.0389, lng: -87.9065 },
  { label: "Minneapolis, MN", lat: 44.9778, lng: -93.265 },
  { label: "St. Louis, MO", lat: 38.627, lng: -90.1994 },
  { label: "Kansas City, MO", lat: 39.0997, lng: -94.5786 },
  { label: "Wichita, KS", lat: 37.6872, lng: -97.3301 },
  { label: "Garden City, KS", lat: 37.9717, lng: -100.8727 },
  { label: "Omaha, NE", lat: 41.2565, lng: -95.9345 },
  { label: "Des Moines, IA", lat: 41.5868, lng: -93.625 },
  { label: "Oklahoma City, Oklahoma", lat: 35.4676, lng: -97.5164 },
  { label: "Midwest City, Oklahoma", lat: 35.4495, lng: -97.3967 },
  { label: "Tulsa, Oklahoma", lat: 36.154, lng: -95.9928 },
  { label: "Dallas, Texas", lat: 32.7767, lng: -96.797 },
  { label: "Fort Worth, Texas", lat: 32.7555, lng: -97.3308 },
  { label: "Austin, Texas", lat: 30.2672, lng: -97.7431 },
  { label: "San Antonio, Texas", lat: 29.4241, lng: -98.4936 },
  { label: "Houston, Texas", lat: 29.7604, lng: -95.3698 },
  { label: "El Paso, Texas", lat: 31.7619, lng: -106.485 },
  { label: "Albuquerque, NM", lat: 35.0844, lng: -106.6504 },
  { label: "Denver, CO", lat: 39.7392, lng: -104.9903 },
  { label: "Colorado Springs, CO", lat: 38.8339, lng: -104.8214 },
  { label: "Salt Lake City, UT", lat: 40.7608, lng: -111.891 },
  { label: "Phoenix, AZ", lat: 33.4484, lng: -112.074 },
  { label: "Tucson, AZ", lat: 32.2226, lng: -110.9747 },
  { label: "Las Vegas, NV", lat: 36.1699, lng: -115.1398 },
  { label: "Los Angeles, CA", lat: 34.0522, lng: -118.2437 },
  { label: "San Diego, CA", lat: 32.7157, lng: -117.1611 },
  { label: "San Francisco, CA", lat: 37.7749, lng: -122.4194 },
  { label: "Sacramento, CA", lat: 38.5816, lng: -121.4944 },
  { label: "Portland, OR", lat: 45.5152, lng: -122.6784 },
  { label: "Seattle, WA", lat: 47.6062, lng: -122.3321 },
  { label: "Boise, ID", lat: 43.615, lng: -116.2023 },
  { label: "Billings, MT", lat: 45.7833, lng: -108.5007 },
  { label: "Atlanta, Georgia", lat: 33.749, lng: -84.388 },
  { label: "Charlotte, NC", lat: 35.2271, lng: -80.8431 },
  { label: "Nashville, TN", lat: 36.1627, lng: -86.7816 },
  { label: "Memphis, TN", lat: 35.1495, lng: -90.049 },
  { label: "Jacksonville, FL", lat: 30.3322, lng: -81.6557 },
  { label: "Orlando, FL", lat: 28.5383, lng: -81.3792 },
  { label: "Miami, FL", lat: 25.7617, lng: -80.1918 },
  { label: "New Orleans, LA", lat: 29.9511, lng: -90.0715 },
  { label: "Little Rock, AR", lat: 34.7465, lng: -92.2896 },
  { label: "Toronto, Canada", lat: 43.6532, lng: -79.3832 },
  { label: "Montreal, Canada", lat: 45.5019, lng: -73.5674 },
  { label: "Ottawa, Canada", lat: 45.4215, lng: -75.6972 },
  { label: "Winnipeg, Canada", lat: 49.8951, lng: -97.1384 },
  { label: "Calgary, Canada", lat: 51.0447, lng: -114.0719 },
  { label: "Edmonton, Canada", lat: 53.5461, lng: -113.4938 },
  { label: "Vancouver, Canada", lat: 49.2827, lng: -123.1207 }
];

function normalizeLocationName(location) {
  return String(location ?? "")
    .toLowerCase()
    .replace(/\b(united states|usa|u\.s\.a\.|u\.s\.|us)\b/g, "")
    .replace(/\bok\b/g, "oklahoma")
    .replace(/\bks\b/g, "kansas")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Resolve a free-text place name to coordinates using the gazetteer.
export function lookupPlace(label) {
  const normalized = normalizeLocationName(label);
  if (!normalized) {
    return null;
  }

  let best = null;
  for (const place of GAZETTEER) {
    const candidate = normalizeLocationName(place.label);
    if (candidate === normalized) {
      return { lat: place.lat, lng: place.lng };
    }
    if (
      !best &&
      (normalized.includes(candidate.split(" ")[0]) || candidate.includes(normalized))
    ) {
      best = place;
    }
  }

  return best ? { lat: best.lat, lng: best.lng } : null;
}

// Nearest known place to a coordinate, within `maxKm`. Used to label movement.
export function nearestPlaceLabel(lat, lng, maxKm = 140) {
  if (!isValidCoordinate(lat, lng)) {
    return null;
  }

  let nearest = null;
  let nearestMeters = Infinity;
  for (const place of GAZETTEER) {
    const meters = haversineMeters([lat, lng], [place.lat, place.lng]);
    if (meters < nearestMeters) {
      nearestMeters = meters;
      nearest = place;
    }
  }

  if (!nearest || nearestMeters > maxKm * 1000) {
    return null;
  }

  return nearestMeters <= 18000 ? nearest.label : `Near ${nearest.label}`;
}
