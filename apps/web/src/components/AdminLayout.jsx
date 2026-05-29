"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { apiRequest, clearToken } from "../lib/api";

export default function AdminLayout({ children, title, action }) {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { href: "/admin/dashboard", label: "Dashboard" },
    { href: "/admin/shipments", label: "Shipments" },
    { href: "/admin/shipments/new", label: "Add Shipment" },
    { href: "/admin/messages", label: "Messages" }
  ];

  function isActive(item) {
    if (pathname === item.href) return true;
    return item.href === "/admin/shipments" && pathname?.startsWith("/admin/shipments/") && pathname !== "/admin/shipments/new";
  }

  const activeNav = navItems.find(isActive)?.href ?? "";

  async function logout() {
    try {
      await apiRequest("/auth/logout", { method: "POST" });
    } catch {
      // Token cleanup still happens locally even if the request fails.
    }

    clearToken();
    router.replace("/admin/login");
  }

  return (
    <div className="min-h-screen bg-[#f7f8fb]">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white p-5 md:block">
        <Link href="/admin/dashboard" className="block text-xl font-semibold text-ink">
          Goods Tracking
        </Link>
        <nav className="mt-8 grid gap-2 text-sm font-medium text-slate-700">
          {navItems.map((item) => (
            <Link
              key={item.href}
              className={`rounded-md px-3 py-2 ${
                isActive(item) ? "bg-slate-100 text-ink" : "hover:bg-slate-100"
              }`}
              href={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <button
          onClick={logout}
          className="absolute bottom-5 left-5 right-5 rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          Log out
        </button>
      </aside>

      <div className="md:pl-64">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-5">
          <div className="mx-auto flex max-w-6xl flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-normal text-signal">Admin</p>
                <h1 className="truncate text-xl font-semibold text-ink sm:text-2xl">{title}</h1>
              </div>
              {action ? <div className="shrink-0">{action}</div> : null}
            </div>

            <label className="sr-only" htmlFor="admin-mobile-navigation">
              Admin navigation
            </label>
            <select
              id="admin-mobile-navigation"
              className="block w-full rounded-md border-2 border-signal bg-white px-3 py-2.5 text-sm font-semibold text-ink shadow-sm outline-none focus:ring-2 focus:ring-signal/30 md:hidden"
              value={activeNav}
              onChange={(event) => {
                if (event.target.value) {
                  router.push(event.target.value);
                }
              }}
            >
              <option value="" disabled>
                Go to admin page
              </option>
              {navItems.map((item) => (
                <option key={item.href} value={item.href}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-4 sm:px-5 sm:py-6">{children}</main>
      </div>
    </div>
  );
}
