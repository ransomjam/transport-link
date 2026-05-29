"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiRequest, clearToken } from "../lib/api";

export default function AdminLayout({ children, title, action }) {
  const router = useRouter();

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
          <Link className="rounded-md px-3 py-2 hover:bg-slate-100" href="/admin/dashboard">
            Dashboard
          </Link>
          <Link className="rounded-md px-3 py-2 hover:bg-slate-100" href="/admin/shipments">
            Shipments
          </Link>
          <Link className="rounded-md px-3 py-2 hover:bg-slate-100" href="/admin/shipments/new">
            Add Shipment
          </Link>
          <Link className="rounded-md px-3 py-2 hover:bg-slate-100" href="/admin/messages">
            Messages
          </Link>
        </nav>
        <button
          onClick={logout}
          className="absolute bottom-5 left-5 right-5 rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          Log out
        </button>
      </aside>

      <div className="md:pl-64">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-normal text-signal">Admin</p>
              <h1 className="text-2xl font-semibold text-ink">{title}</h1>
            </div>
            {action}
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-5 py-6">{children}</main>
      </div>
    </div>
  );
}
