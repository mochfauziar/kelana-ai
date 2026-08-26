"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listTrips, deleteTrip, type TripSummary } from "@/services/tripServices";
import TripCard from "@/components/TripCard";

export default function TripsPage() {
  const [trips, setTrips] = useState<TripSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchTrips() {
    setLoading(true);
    setError(null);
    try {
      const data = await listTrips();
      setTrips(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load trips.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteTrip(id);
      setTrips((prev) => prev.filter((t) => t.id !== id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete trip.");
    }
  }

  useEffect(() => {
    fetchTrips();
  }, []);

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
          href="/"
          className="text-xs font-semibold uppercase tracking-widest text-neutral-500 hover:text-white border border-neutral-800 hover:border-neutral-600 rounded-xl px-4 py-2 transition"
        >
          + New Trip
        </Link>
      </header>

      <div className="flex-1 px-4 py-12 max-w-4xl mx-auto w-full">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Your Trips</h1>
          <p className="mt-1 text-sm text-neutral-500">
            All saved trip plans in one place.
          </p>
        </div>

        {/* States */}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Loading trips…
          </div>
        )}

        {error && (
          <p className="text-xs text-red-400 bg-red-950/40 border border-red-900/50 rounded-xl px-4 py-3">
            {error}
          </p>
        )}

        {!loading && !error && trips.length === 0 && (
          <div className="text-center py-24">
            <p className="text-neutral-600 text-sm">No trips yet.</p>
            <Link
              href="/"
              className="mt-4 inline-block text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition"
            >
              Plan your first trip →
            </Link>
          </div>
        )}

        {/* Trip grid */}
        {!loading && trips.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trips.map((trip) => (
              <TripCard key={trip.id} trip={trip} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
