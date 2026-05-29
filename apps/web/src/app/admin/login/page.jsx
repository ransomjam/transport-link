"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, setToken } from "../../../lib/api";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(event.currentTarget);

    try {
      const data = await apiRequest("/auth/login", {
        method: "POST",
        auth: false,
        body: {
          email: form.get("email"),
          password: form.get("password")
        }
      });

      setToken(data.token);
      router.replace("/admin/dashboard");
    } catch (loginError) {
      setError(loginError.message || "Invalid login details");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] px-6 py-12">
      <section className="w-full max-w-md rounded-md bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-normal text-signal">Admin access</p>
          <h1 className="mt-2 text-3xl font-semibold text-ink">Log in</h1>
        </div>

        {error ? (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        ) : null}

        <form onSubmit={submit} className="grid gap-4">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Email
            <input
              name="email"
              type="email"
              required
              className="rounded-md border border-slate-300 px-3 py-2 text-base outline-none focus:border-signal"
              placeholder="admin@goodstracking.local"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Password
            <input
              name="password"
              type="password"
              required
              minLength={8}
              className="rounded-md border border-slate-300 px-3 py-2 text-base outline-none focus:border-signal"
              placeholder="AdminPass123!"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-md bg-signal px-4 py-3 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>
      </section>
    </main>
  );
}
