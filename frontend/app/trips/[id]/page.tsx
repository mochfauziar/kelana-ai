"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getTrip, type TripSummary } from "@/services/tripServices";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="block text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-1.5">
      {children}
    </span>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 p-4 rounded-xl bg-neutral-900 border border-neutral-800">
      <span className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
        {label}
      </span>
      <span className="text-lg font-semibold text-white leading-tight">
        {value}
      </span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TripDetailPage() {
  const params = useParams();
  const id = Number(params?.id);

  const [trip, setTrip] = useState<TripSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getTrip(id)
      .then(setTrip)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Failed to load trip.")
      )
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <main className="min-h-screen bg-neutral-950 text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-neutral-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <Link
            href="/"
            className="text-sm font-semibold tracking-widest uppercase text-neutral-300 hover:text-white transition"
          >
            Kelana<span className="text-emerald-400">AI</span>
          </Link>
        </div>
        <Link
          href="/trips"
          className="text-xs font-semibold uppercase tracking-widest text-neutral-500 hover:text-white border border-neutral-800 hover:border-neutral-600 rounded-xl px-4 py-2 transition"
        >
          ← All Trips
        </Link>
      </header>

      <div className="flex-1 px-4 py-12 max-w-2xl mx-auto w-full">
        {/* Loading */}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-neutral-500 pt-8">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Loading trip…
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-xs text-red-400 bg-red-950/40 border border-red-900/50 rounded-xl px-4 py-3">
            {error}
          </p>
        )}

        {/* Detail */}
        {trip && (
          <>
            {/* Title */}
            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-1">
                Trip #{trip.id}
              </p>
              <h1 className="text-3xl font-bold tracking-tight">
                {trip.destination}
              </h1>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              <StatCard label="Total Budget" value={formatCurrency(trip.budget)} />
              <StatCard label="Daily Budget" value={formatCurrency(trip.daily_budget)} />
              <StatCard label="Days" value={`${trip.days} days`} />
            </div>

            {/* Category */}
            <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 mb-6">
              <Label>Category</Label>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {trip.category}
              </span>
            </div>

            {/* AI Recommendation */}
            {trip.ai_recommendation && (
              <div className="p-6 rounded-xl bg-neutral-900 border border-neutral-800">
                <Label>AI Recommendation</Label>
                <div className="mt-3 text-sm text-neutral-300 leading-relaxed whitespace-pre-line">
                  {trip.ai_recommendation}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
