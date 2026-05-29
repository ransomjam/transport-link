"use client";

import { useState } from "react";
import { contactServiceOptions } from "../lib/public-content";
import { apiRequest } from "../lib/api";

export default function ContactForm() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      await apiRequest("/messages", {
        method: "POST",
        body: data,
        auth: false
      });
      setSent(true);
      event.currentTarget.reset();
    } catch (err) {
      setError(err.message || "Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 rounded-md bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First Name" name="firstName" required disabled={loading || sent} />
        <Field label="Last Name" name="lastName" required disabled={loading || sent} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Email" name="email" type="email" required disabled={loading || sent} />
        <Field label="Phone Number" name="phone" type="tel" disabled={loading || sent} />
      </div>
      <label className="grid gap-2 text-sm font-semibold text-slate-700">
        Select Service
        <select name="service" disabled={loading || sent} className="min-h-12 rounded-md border border-slate-300 bg-white px-3 text-base text-[#1F2937] outline-none focus:border-[#049DBF]">
          <option value="">General Inquiry</option>
          {contactServiceOptions.map((service) => (
            <option key={service} value={service}>{service}</option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-semibold text-slate-700">
        Message
        <textarea
          className="min-h-36 rounded-md border border-slate-300 px-3 py-3 text-base text-[#1F2937] outline-none focus:border-[#049DBF]"
          name="message"
          required
          disabled={loading || sent}
        />
      </label>
      
      {error ? (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      ) : null}
      
      {sent ? (
        <p className="rounded-md bg-emerald-50 px-4 py-3 text-sm font-semibold text-[#0AA66D]">
          Thanks. Your message is ready for our logistics team.
        </p>
      ) : null}
      
      <button disabled={loading || sent} className="w-fit rounded-md bg-[#0F2742] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#049DBF] disabled:opacity-50">
        {loading ? "Sending..." : "Send message"}
      </button>
    </form>
  );
}

function Field({ label, ...props }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-700">
      {label}
      <input
        className="min-h-12 rounded-md border border-slate-300 px-3 text-base text-[#1F2937] outline-none focus:border-[#049DBF]"
        {...props}
      />
    </label>
  );
}
