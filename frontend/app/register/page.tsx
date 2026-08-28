"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { register } from "@/services/authServices";

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm]       = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await register({ name: form.name, email: form.email, password: form.password });
      // Setelah register berhasil, arahkan ke login
      router.push("/login");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-10">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span className="text-sm font-semibold tracking-widest uppercase text-neutral-300">
            Kelana<span className="text-emerald-400">AI</span>
          </span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight mb-1">Create account</h1>
        <p className="text-sm text-neutral-500 mb-8">Start planning AI-powered trips today.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-1.5">
              Name
            </label>
            <input
              name="name"
              type="text"
              placeholder="Alice"
              value={form.name}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full rounded-xl bg-neutral-900 border border-neutral-800 px-4 py-3 text-sm text-white placeholder-neutral-600 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50 transition"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-1.5">
              Email
            </label>
            <input
              name="email"
              type="email"
              placeholder="alice@email.com"
              value={form.email}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full rounded-xl bg-neutral-900 border border-neutral-800 px-4 py-3 text-sm text-white placeholder-neutral-600 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50 transition"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-1.5">
              Password
            </label>
            <input
              name="password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              required
              minLength={8}
              disabled={loading}
              className="w-full rounded-xl bg-neutral-900 border border-neutral-800 px-4 py-3 text-sm text-white placeholder-neutral-600 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50 transition"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 text-xs text-red-400 bg-red-950/40 border border-red-900/50 rounded-xl px-4 py-3">
              <span className="mt-0.5 shrink-0">✕</span>
              <span>{error}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="mt-1 w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-neutral-800 disabled:text-neutral-600 disabled:cursor-not-allowed text-neutral-950 font-semibold py-3 text-sm transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="h-3.5 w-3.5 rounded-full border-2 border-neutral-600 border-t-neutral-400 animate-spin" />
                Creating account…
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-neutral-500">
          Already have an account?{" "}
          <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-semibold transition">
            Sign In
          </Link>
        </p>
      </div>
    </main>
  );
}
