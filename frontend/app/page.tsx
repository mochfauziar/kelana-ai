"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createTrip, type TripRequest, type TripResult } from "@/services/tripServices";
import { getUser, clearSession, type AuthUser } from "@/services/authServices";
import DaysCard from "@/components/DaysCard";

// ─── Constants ────────────────────────────────────────────────────────────────

const TRAVEL_STYLES = ["Budget", "Standard", "Comfort", "Luxury", "Family"];

const INITIAL_FORM: TripRequest = {
  destination:  "",
  days:         5,
  budget:       1000,
  travel_style: "Standard",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="block text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-1.5">
      {children}
    </span>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col gap-0.5 p-4 rounded-xl bg-neutral-900 border border-neutral-800">
      <span className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
        {label}
      </span>
      <span className="text-lg font-semibold text-white leading-tight">{value}</span>
    </div>
  );
}

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-xl bg-neutral-800 ${className ?? ""}`} />
  );
}

function LoadingOverlay({ destination }: { destination: string }) {
  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/90 backdrop-blur-sm flex flex-col items-center justify-center gap-6 px-4">
      <div className="relative h-14 w-14">
        <div className="absolute inset-0 rounded-full border-2 border-neutral-800" />
        <div className="absolute inset-0 rounded-full border-2 border-t-emerald-400 animate-spin" />
      </div>
      <div className="text-center">
        <p className="text-base font-semibold text-white">
          Planning your trip to{" "}
          <span className="text-emerald-400">{destination}</span>…
        </p>
        <p className="mt-1.5 text-xs text-neutral-500">
          AI is crafting your personalised itinerary. This may take a moment.
        </p>
      </div>
      <div className="w-full max-w-2xl mt-4 flex flex-col gap-3 opacity-40">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16" />)}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
        </div>
        <Skeleton className="h-48" />
        <Skeleton className="h-36" />
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Home() {
  const router = useRouter();

  const [form, setForm]       = useState<TripRequest>(INITIAL_FORM);
  const [result, setResult]   = useState<TripResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [user, setUser]       = useState<AuthUser | null>(null);

  // Baca user dari localStorage setelah mount (client-only)
  useEffect(() => {
    setUser(getUser());
  }, []);

  function handleLogout() {
    clearSession();
    setUser(null);
    router.push("/login");
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "days" || name === "budget" ? Number(value) : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await createTrip(form);
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setResult(null);
    setForm(INITIAL_FORM);
    setError(null);
  }

  return (
    <>
      {loading && <LoadingOverlay destination={form.destination} />}

      <main className="min-h-screen bg-neutral-950 text-white flex flex-col">
        {/* Header */}
        <header className="border-b border-neutral-900 px-6 py-4 flex items-center gap-3">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span className="text-sm font-semibold tracking-widest uppercase text-neutral-300">
            Kelana<span className="text-emerald-400">AI</span>
          </span>
          <div className="ml-auto flex items-center gap-3">
            <Link
              href="/trips"
              className="text-xs font-semibold uppercase tracking-widest text-neutral-500 hover:text-white border border-neutral-800 hover:border-neutral-600 rounded-xl px-4 py-2 transition"
            >
              My Trips
            </Link>
            {user ? (
              <>
                <Link
                  href="/profile"
                  className="text-xs font-semibold uppercase tracking-widest text-neutral-500 hover:text-white border border-neutral-800 hover:border-neutral-600 rounded-xl px-4 py-2 transition hidden sm:block"
                >
                  {user.name}
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-xs font-semibold uppercase tracking-widest text-neutral-500 hover:text-red-400 border border-neutral-800 hover:border-red-900 rounded-xl px-4 py-2 transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="text-xs font-semibold uppercase tracking-widest text-emerald-400 hover:text-emerald-300 border border-emerald-900 hover:border-emerald-700 rounded-xl px-4 py-2 transition"
              >
                Sign In
              </Link>
            )}
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
          {!result ? (
            /* ─────────── FORM ─────────── */
            <div className="w-full max-w-md">
              <div className="mb-10">
                <h1 className="text-3xl font-bold tracking-tight text-white">KelanaAI.</h1>
                <p className="mt-2 text-sm text-neutral-500">
                  Tell us where you&apos;re going and we&apos;ll handle the rest.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {/* Destination */}
                <div>
                  <Label>Destination</Label>
                  <input
                    name="destination"
                    type="text"
                    placeholder="e.g. Japan, Bali, Paris"
                    value={form.destination}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className="w-full rounded-xl bg-neutral-900 border border-neutral-800 px-4 py-3 text-sm text-white placeholder-neutral-600 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50 transition"
                  />
                </div>

                {/* Days + Budget */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Days</Label>
                    <input
                      name="days"
                      type="number"
                      min={1}
                      max={365}
                      value={form.days}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      className="w-full rounded-xl bg-neutral-900 border border-neutral-800 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50 transition"
                    />
                  </div>
                  <div>
                    <Label>Budget (USD)</Label>
                    <input
                      name="budget"
                      type="number"
                      min={1}
                      value={form.budget}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      className="w-full rounded-xl bg-neutral-900 border border-neutral-800 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50 transition"
                    />
                  </div>
                </div>

                {/* Travel Style */}
                <div>
                  <Label>Travel Style</Label>
                  <select
                    name="travel_style"
                    value={form.travel_style}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full rounded-xl bg-neutral-900 border border-neutral-800 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50 transition appearance-none cursor-pointer"
                  >
                    {TRAVEL_STYLES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
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
                      Planning…
                    </>
                  ) : (
                    "Generate Trip Plan"
                  )}
                </button>
              </form>
            </div>
          ) : (
            /* ─────────── RESULT ─────────── */
            <div className="w-full max-w-2xl animate-[fadeIn_0.4s_ease]">
              <div className="mb-8">
                <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-1">
                  Trip #{result.id}
                </p>
                <h1 className="text-3xl font-bold tracking-tight">{result.destination}</h1>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <StatCard label="Total Budget"  value={formatCurrency(result.budget)} />
                <StatCard label="Daily Budget"  value={formatCurrency(result.daily_budget)} />
                <StatCard label="Days"          value={`${form.days} days`} />
                <StatCard label="Travel Style"  value={form.travel_style} />
              </div>

              {/* Category + Transport */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
                  <Label>Category</Label>
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    {result.category}
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
                  <Label>Transportation</Label>
                  <span className="text-sm font-semibold text-white">
                    {result.recommendation_transportation}
                  </span>
                </div>
              </div>

              {/* Itinerary */}
              <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-5 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
                    Itinerary
                  </span>
                  <span className="text-xs text-neutral-600">·</span>
                  <span className="text-xs text-neutral-600">
                    {form.days} {form.days === 1 ? "day" : "days"}
                  </span>
                </div>
                <DaysCard text={result.ai_recommendation} />
              </div>

              {/* Local Food */}
              {result.local_food_recommendation && (
                <div className="p-6 rounded-xl bg-neutral-900 border border-neutral-800 mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Label>Local Food</Label>
                    <span className="mb-1.5 text-base">🍜</span>
                  </div>
                  <div className="text-sm text-neutral-300 leading-relaxed whitespace-pre-line">
                    {result.local_food_recommendation}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between">
                <button
                  onClick={handleReset}
                  className="text-xs font-semibold uppercase tracking-widest text-neutral-500 hover:text-white border border-neutral-800 hover:border-neutral-600 rounded-xl px-4 py-2.5 transition"
                >
                  + New Trip
                </button>
                <Link
                  href="/trips"
                  className="text-xs font-semibold uppercase tracking-widest text-emerald-400 hover:text-emerald-300 transition"
                >
                  View all trips →
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
