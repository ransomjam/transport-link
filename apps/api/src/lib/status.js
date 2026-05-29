export const shipmentStatuses = [
  "SHIPMENT_CREATED",
  "PICKED_UP",
  "IN_TRANSIT",
  "AT_SORTING_FACILITY",
  "ARRIVED_AT_DESTINATION_CITY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "DELAYED",
  "ON_HOLD",
  "CANCELLED"
];

const labelByStatus = {
  SHIPMENT_CREATED: "Shipment Created",
  PICKED_UP: "Picked Up",
  IN_TRANSIT: "In Transit",
  AT_SORTING_FACILITY: "At Sorting Facility",
  ARRIVED_AT_DESTINATION_CITY: "Arrived at Destination City",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  DELAYED: "Delayed",
  ON_HOLD: "On Hold",
  CANCELLED: "Cancelled"
};

export function normalizeStatus(value) {
  if (!value) {
    return value;
  }

  const normalized = String(value)
    .trim()
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-\s]+/g, "_")
    .toUpperCase();

  return shipmentStatuses.includes(normalized) ? normalized : value;
}

export function getStatusLabel(status) {
  return labelByStatus[status] ?? status;
}
