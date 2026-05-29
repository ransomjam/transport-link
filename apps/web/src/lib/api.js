"use client";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export const shipmentStatuses = [
  ["SHIPMENT_CREATED", "Shipment Created"],
  ["PICKED_UP", "Picked Up"],
  ["IN_TRANSIT", "In Transit"],
  ["AT_SORTING_FACILITY", "At Sorting Facility"],
  ["ARRIVED_AT_DESTINATION_CITY", "Arrived at Destination City"],
  ["OUT_FOR_DELIVERY", "Out for Delivery"],
  ["DELIVERED", "Delivered"],
  ["DELAYED", "Delayed"],
  ["ON_HOLD", "On Hold"],
  ["CANCELLED", "Cancelled"]
];

export const shipmentTypes = ["Parcel", "Cargo", "Freight", "Container", "Document", "Vehicle Part", "Other"];

export const shipmentModes = [
  "Ocean Transport",
  "Air Freight",
  "Inland Transport",
  "Ground Freight",
  "Less-than-Container Load (LCL)",
  "Home Delivery",
  "Courier",
  "Other"
];

export const carrierOptions = ["DHL", "FedEx", "UPS", "USPS", "transport-link", "Other"];

export const paymentModes = ["Cash", "Card", "Bank Transfer", "Zelle", "PayPal", "Mobile Money", "Paid", "Unpaid", "Other"];

export function getToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem("adminToken");
}

export function setToken(token) {
  window.localStorage.setItem("adminToken", token);
}

export function clearToken() {
  window.localStorage.removeItem("adminToken");
}

export async function apiRequest(path, options = {}) {
  const { method = "GET", body, auth = true } = options;
  const headers = {
    "Content-Type": "application/json"
  };

  const token = getToken();

  if (auth && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message ?? "Request failed");
  }

  return data;
}

export function statusLabel(status) {
  return shipmentStatuses.find(([value]) => value === status)?.[1] ?? status;
}

export function toDateTimeInput(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return "";
  }

  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export function toDateInput(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return "";
  }

  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export function formatDate(value) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function formatDateOnly(value) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium"
  }).format(new Date(value));
}

export function formatTime(value) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    timeStyle: "short"
  }).format(new Date(value));
}
