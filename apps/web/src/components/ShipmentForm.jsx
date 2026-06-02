"use client";

import { useState } from "react";
import { carrierOptions, paymentModes, shipmentModes, shipmentStatuses, shipmentTypes, toDateInput, toDateTimeInput } from "../lib/api";


export default function ShipmentForm({ shipment, loading = false, onSubmit, submitLabel = "Save shipment" }) {

  function submit(event) {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(event.currentTarget).entries());
    onSubmit(body);
  }


  return (
    <form onSubmit={submit} className="grid gap-5">
      <FormSection title="Tracking Information">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Field name="trackingId" label="Tracking ID" defaultValue={shipment?.trackingId ?? ""} placeholder="Auto-generated if left empty" />
          <Select name="currentStatus" label="Current Status" defaultValue={shipment?.currentStatus ?? "SHIPMENT_CREATED"} options={shipmentStatuses} />
          <Select name="shipmentType" label="Shipment Type" defaultValue={shipment?.shipmentType ?? ""} options={toOptions(shipmentTypes)} />
          <ReadOnlyHint text="Tracking IDs are generated automatically when left blank." />
        </div>
      </FormSection>

      <FormSection title="Shipper Information">
        <div className="grid gap-4 md:grid-cols-2">
          <Field name="senderName" label="Sender Name" defaultValue={shipment?.senderName ?? ""} required />
          <Field name="senderAddress" label="Sender Address" defaultValue={shipment?.senderAddress ?? ""} />
          <Field name="senderPhone" label="Sender Phone" defaultValue={shipment?.senderPhone ?? ""} />
          <Field name="senderEmail" label="Sender Email" type="email" defaultValue={shipment?.senderEmail ?? ""} />
        </div>
      </FormSection>

      <FormSection title="Receiver Information">
        <div className="grid gap-4 md:grid-cols-2">
          <Field name="receiverName" label="Receiver Name" defaultValue={shipment?.receiverName ?? ""} required />
          <Field name="receiverAddress" label="Receiver Address" defaultValue={shipment?.receiverAddress ?? ""} />
          <Field name="receiverPhone" label="Receiver Phone" defaultValue={shipment?.receiverPhone ?? ""} />
          <Field name="receiverEmail" label="Receiver Email" type="email" defaultValue={shipment?.receiverEmail ?? ""} />
        </div>
      </FormSection>

      <FormSection title="Shipment Information">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Field name="origin" label="Origin" defaultValue={shipment?.origin ?? ""} required />
          <Field name="destination" label="Destination" defaultValue={shipment?.destination ?? ""} required />
          <Field name="currentLocation" label="Current / Last Updated Location" defaultValue={shipment?.currentLocation ?? ""} />
          <Field name="packageDescription" label="Package Description" defaultValue={shipment?.packageDescription ?? ""} />
          <Select name="carrier" label="Carrier" defaultValue={shipment?.carrier ?? ""} options={toOptions(carrierOptions)} />
          <Select name="shipmentMode" label="Shipment Mode" defaultValue={shipment?.shipmentMode ?? ""} options={toOptions(shipmentModes)} />
          <Field name="weight" label="Weight" defaultValue={shipment?.weight ?? ""} placeholder="65kg" />
          <Select name="paymentMode" label="Payment Mode" defaultValue={shipment?.paymentMode ?? ""} options={toOptions(paymentModes)} />
          <Field name="totalFreight" label="Total Freight" defaultValue={shipment?.totalFreight ?? ""} />
          <Field name="pickupDate" label="Pick-up Date" type="date" defaultValue={toDateInput(shipment?.pickupDate)} />
          <Field name="pickupTime" label="Pick-up Time" type="time" defaultValue={shipment?.pickupTime ?? ""} />
          <Field name="departureDate" label="Departure Date" type="datetime-local" defaultValue={toDateTimeInput(shipment?.departureDate)} />
          <Field name="departureTime" label="Departure Time" type="time" defaultValue={shipment?.departureTime ?? ""} />
          <Field name="estimatedDeliveryDate" label="Expected Delivery Date" type="datetime-local" defaultValue={toDateTimeInput(shipment?.estimatedDeliveryDate)} required />
          <Field name="actualDeliveryDate" label="Actual Delivery Date" type="datetime-local" defaultValue={toDateTimeInput(shipment?.actualDeliveryDate)} />
        </div>
        <TextArea name="comments" label="Comments" defaultValue={shipment?.comments ?? ""} />
      </FormSection>



      <FormSection title="Notes">
        <div className="grid gap-4 md:grid-cols-2">
          <TextArea name="publicNote" label="Public Note / Comments" defaultValue={shipment?.publicNote ?? ""} />
          <TextArea name="adminNote" label="Admin Note" defaultValue={shipment?.adminNote ?? ""} />
        </div>
      </FormSection>

      <button disabled={loading} className="w-fit rounded-md bg-signal px-5 py-3 text-sm font-semibold text-white disabled:opacity-70">
        {loading ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}

function toOptions(values) {
  return values.map((value) => [value, value]);
}

function FormSection({ title, action, children }) {
  return (
    <section className="rounded-md bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        {action}
      </div>
      <div className="grid gap-4">{children}</div>
    </section>
  );
}

function Field({ label, ...props }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      {label}
      <input className="min-h-11 rounded-md border border-slate-300 px-3 py-2 text-base outline-none focus:border-signal" {...props} />
    </label>
  );
}

function Select({ label, options, ...props }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      {label}
      <select className="min-h-11 rounded-md border border-slate-300 px-3 py-2 text-base outline-none focus:border-signal" {...props}>
        <option value="">Select option</option>
        {options.map(([value, labelText]) => (
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
      <textarea className="min-h-24 rounded-md border border-slate-300 px-3 py-2 text-base outline-none focus:border-signal" {...props} />
    </label>
  );
}

function ReadOnlyHint({ text }) {
  return (
    <div className="rounded-md bg-slate-50 p-3 text-sm leading-6 text-slate-600 ring-1 ring-slate-200">
      {text}
    </div>
  );
}
