"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getTrip, type TripSummary } from "@/services/tripServices";
import { useAuthGuard } from "@/lib/useAuthGuard";
import DaysCard from "@/components/DaysCard";

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
    <span
      className="block text-xs font-semibold uppercase tracking-widest mb-1.5"
      style={{ color: "var(--text-muted)" }}
    >
      {children}
    </span>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex flex-col gap-0.5 p-4 rounded-xl"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
    >
      <span
        className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </span>
      <span
        className="text-lg font-semibold leading-tight"
        style={{ color: "var(--text-primary)" }}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TripDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params?.id);

  const { ready } = useAuthGuard();

  const [trip, setTrip]     = useState<TripSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !id) return;
    setLoading(true);
    getTrip(id)
      .then(setTrip)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Failed to load trip.")
      )
      .finally(() => setLoading(false));
  }, [ready, id]);

  if (!ready) return null;

  return (
    <main
      className="min-h-screen flex flex-col"
      style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}
    >
      {/* Header */}
      <header
        className="border-b px-6 py-4 flex items-center justify-between"
        style={{ borderColor: "var(--border)", background: "var(--bg-base)" }}
      >
        <div className="flex items-center gap-3">
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: "var(--accent)" }}
          />
          <Link
            href="/"
            className="text-sm font-semibold tracking-widest uppercase transition-opacity hover:opacity-75"
            style={{ color: "var(--text-secondary)" }}
          >
            Kelana<span style={{ color: "var(--accent)" }}>AI</span>
          </Link>
        </div>
        <Link
          href="/trips"
          className="text-xs font-semibold uppercase tracking-widest rounded-xl px-4 py-2 border transition-opacity hover:opacity-75"
          style={{ color: "var(--text-muted)", borderColor: "var(--border)" }}
        >
          ← All Trips
        </Link>
      </header>

      <div className="flex-1 px-4 py-12 max-w-2xl mx-auto w-full">
        {/* Loading */}
        {loading && (
          <div
            className="flex items-center gap-2 text-sm pt-8"
            style={{ color: "var(--text-muted)" }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full animate-pulse"
              style={{ background: "var(--accent)" }}
            />
            Loading trip…
          </div>
        )}

        {/* Error */}
        {error && (
          <p
            className="text-xs rounded-xl px-4 py-3"
            style={{
              color:      "#f87171",
              background: "rgba(127,29,29,0.25)",
              border:     "1px solid rgba(127,29,29,0.5)",
            }}
            role="alert"
          >
            {error}
          </p>
        )}

        {/* Detail */}
        {trip && (
          <>
            {/* Title */}
            <div className="mb-8">
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-1"
                style={{ color: "var(--accent)" }}
              >
                Trip #{trip.id}
              </p>
              <h1 className="text-3xl font-bold tracking-tight">{trip.destination}</h1>
              {trip.summary && (
                <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                  {trip.summary}
                </p>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              <StatCard label="Total Budget" value={formatCurrency(trip.budget)} />
              <StatCard label="Daily Budget" value={formatCurrency(trip.daily_budget)} />
              <StatCard label="Days"         value={`${trip.days} days`} />
            </div>

            {/* Category */}
            <div
              className="p-4 rounded-xl mb-6"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
            >
              <Label>Category</Label>
              <span
                className="inline-flex items-center gap-1.5 text-sm font-semibold"
                style={{ color: "var(--accent)" }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: "var(--accent)" }}
                />
                {trip.category}
              </span>
            </div>

            {/* AI Itinerary */}
            {trip.ai_recommendation && (
              <div
                className="p-6 rounded-xl mb-6"
                style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
              >
                <Label>AI Itinerary</Label>
                <div className="mt-3">
                  <DaysCard text={trip.ai_recommendation} />
                </div>
              </div>
            )}

            {/* Food Recommendations */}
            {trip.local_food_recommendation && (
              <div
                className="p-6 rounded-xl"
                style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
              >
                <Label>Local Food Recommendations</Label>
                <div
                  className="mt-3 text-sm leading-relaxed whitespace-pre-wrap"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {trip.local_food_recommendation}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
