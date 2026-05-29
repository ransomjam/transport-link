"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { brand, navLinks } from "../lib/public-content";

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-3" aria-label={`${brand.name} home`}>
          {brand.logo ? (
            <img src={brand.logo} alt={brand.name} className="h-10 sm:h-12 w-auto object-contain" />
          ) : (
            <>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[#0F2742] text-sm font-bold text-white shadow-sm">
                {brand.shortName}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-base font-bold text-[#0F2742]">{brand.name}</span>
                <span className="block text-xs font-semibold text-[#049DBF]">Shipping and logistics</span>
              </span>
            </>
          )}
        </Link>

        <div className="hidden items-center gap-7 text-sm font-semibold text-slate-700 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={pathname === link.href ? "text-[#049DBF]" : "transition hover:text-[#049DBF]"}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <a className="text-sm font-semibold text-[#0F2742] transition hover:text-[#049DBF]" href={`tel:${brand.phone}`}>
            Call us: {brand.phone}
          </a>
          <Link className="rounded-md bg-[#0F2742] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#049DBF]" href="/track">
            Track
          </Link>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <Link className="rounded-md bg-[#0F2742] px-3 py-2 text-sm font-semibold text-white" href="/track">
            Track
          </Link>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-300 text-[#0F2742]"
            aria-label="Toggle navigation menu"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            <span className="grid gap-1">
              <span className="block h-0.5 w-5 bg-current" />
              <span className="block h-0.5 w-5 bg-current" />
              <span className="block h-0.5 w-5 bg-current" />
            </span>
          </button>
        </div>
      </nav>

      {open ? (
        <div className="border-t border-slate-200 bg-white px-5 py-4 shadow-sm lg:hidden">
          <div className="mx-auto grid max-w-7xl gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <a className="rounded-md bg-[#F5F8FA] px-3 py-3 text-sm font-semibold text-[#0F2742]" href={`tel:${brand.phone}`}>
              Call us: {brand.phone}
            </a>
          </div>
        </div>
      ) : null}
    </header>
  );
}
