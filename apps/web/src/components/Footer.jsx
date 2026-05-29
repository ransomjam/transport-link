import Link from "next/link";
import { brand, footerServices } from "../lib/public-content";

export default function Footer() {
  return (
    <footer className="bg-[#0F2742] text-white">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        
        {/* Brand & Contact Info */}
        <div className="lg:col-span-2">
          <h2 className="mb-4 text-xl font-bold tracking-wide text-white">transport-link</h2>
          <p className="mb-6 max-w-md leading-relaxed text-slate-300 text-sm">
            Contact transport-link if you are looking for a fast spot quote, detailed freight forwarding quotation, or have a question about any of our logistics. Our team is here to help and we aim to get back to you within 30 minutes during office hours.
          </p>
          <div className="space-y-2 text-sm text-slate-300">
            <p><span className="font-medium text-white">Head Office:</span> United States</p>
            <p><span className="font-medium text-white">Hours:</span> {brand.openingHours}</p>
          </div>
        </div>

        {/* Services */}
        <FooterColumn title="Services">
          {footerServices.map((service) => (
            <Link key={service} href="/services" className="transition hover:text-white">
              {service}
            </Link>
          ))}
        </FooterColumn>

        {/* Branches */}
        <FooterColumn title="Branches">
          <p>USA</p>
          <p>Australia</p>
          <p>Canada</p>
          <p>United Kingdom</p>
          <p>Worldwide</p>
        </FooterColumn>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col-reverse items-center justify-between gap-4 px-5 py-6 text-sm text-slate-400 sm:flex-row lg:px-8">
          <p>Copyright &copy; {new Date().getFullYear()} transport-link. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a className="font-medium text-white transition hover:text-[#049DBF]" href={`tel:${brand.phone}`}>
              Call us: {brand.phone}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }) {
  return (
    <section>
      <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-white">{title}</h2>
      <div className="flex flex-col gap-3 text-sm text-slate-300">{children}</div>
    </section>
  );
}
