"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, clearToken } from "../lib/api";

export default function AdminGuard({ children }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    apiRequest("/auth/me")
      .then(() => {
        if (active) {
          setReady(true);
        }
      })
      .catch(() => {
        clearToken();
        router.replace("/admin/login");
      });

    return () => {
      active = false;
    };
  }, [router]);

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] px-6">
        <div className="rounded-md bg-white px-5 py-4 text-sm font-medium text-slate-600 shadow-sm ring-1 ring-slate-200">
          Checking admin access...
        </div>
      </main>
    );
  }

  return children;
}
