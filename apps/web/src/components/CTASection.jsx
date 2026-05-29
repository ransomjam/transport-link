"use client";

import { useState } from "react";
import Link from "next/link";
import { brand } from "../lib/public-content";
import ContactForm from "./ContactForm";

export default function CTASection({
  heading = "Are you looking for professional transport services?",
  text = `Call us now: ${brand.phone}`,
  buttonLabel = "Contact Us",
  href = "/contact",
  dark = true
}) {
  const [showForm, setShowForm] = useState(false);

  return (
    <section className={dark ? "bg-[#0F2742] text-white" : "bg-[#F5F8FA] text-[#0F2742]"}>
      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-12 md:grid-cols-[1fr_auto] md:items-center lg:px-8">
        <div>
          <h2 className="text-3xl font-semibold">{heading}</h2>
          <p className={`mt-3 text-lg ${dark ? "text-slate-200" : "text-slate-600"}`}>{text}</p>
        </div>
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className={`inline-flex w-fit items-center justify-center rounded-md px-5 py-3 text-sm font-semibold transition ${
              dark ? "bg-white text-[#0F2742] hover:bg-[#E8F7FA]" : "bg-[#0F2742] text-white hover:bg-[#049DBF]"
            }`}
          >
            {buttonLabel}
          </button>
        ) : (
          <button
            onClick={() => setShowForm(false)}
            className="inline-flex w-fit items-center justify-center rounded-md border border-current px-5 py-3 text-sm font-semibold opacity-70 transition hover:opacity-100"
          >
            Close Form
          </button>
        )}
      </div>
      
      {showForm && (
        <div className="mx-auto max-w-4xl px-5 pb-12 lg:px-8">
          <ContactForm />
        </div>
      )}
    </section>
  );
}
