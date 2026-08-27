"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { listTrips, deleteTrip, type TripSummary } from "@/services/tripServices";
import TripCard from "@/components/TripCard";

const TRAVEL_STYLES = ["All", "Budget", "Standard", "Comfort", "Luxury", "Family"];

type SortOption = "latest" | "oldest" | "highest_budget";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "latest",         label: "Latest" },
  { value: "oldest",         label: "Oldest" },
  { value: "highest_budget", label: "Highest Budget" },
];

// ─── Search Bar ───────────────────────────────────────────────────────────────

function SearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      {/* Search icon */}
      <svg
        className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-600 pointer-events-none"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
      >
        <circle cx="11" cy="11" r="8" />
        <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
      </svg>
      <input
        type="text"
        placeholder="Search destination…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl bg-neutral-900 border border-neutral-800 pl-9 pr-10 py-2.5 text-sm text-white placeholder-neutral-600 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
      />
      {/* Clear button */}
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-300 transition"
          aria-label="Clear search"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

// ─── Style Filter ─────────────────────────────────────────────────────────────

function StyleFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {TRAVEL_STYLES.map((style) => (
        <button
          key={style}
          onClick={() => onChange(style)}
          className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition ${
            value === style
              ? "bg-emerald-500 border-emerald-500 text-neutral-950"
              : "bg-transparent border-neutral-800 text-neutral-500 hover:border-neutral-600 hover:text-white"
          }`}
        >
          {style}
        </button>
      ))}
    </div>
  );
}

// ─── Sort Dropdown ────────────────────────────────────────────────────────────

function SortDropdown({
  value,
  onChange,
}: {
  value: SortOption;
  onChange: (v: SortOption) => void;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortOption)}
        className="appearance-none bg-neutral-900 border border-neutral-800 text-xs font-semibold text-neutral-300 rounded-xl pl-3 pr-8 py-2.5 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 cursor-pointer transition hover:border-neutral-600"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {/* Chevron icon */}
      <svg
        className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-neutral-600 pointer-events-none"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptySearch({ query, style }: { query: string; style: string }) {
  return (
    <div className="text-center py-20">
      <p className="text-2xl mb-3">🔍</p>
      <p className="text-sm font-semibold text-white">No trips found</p>
      <p className="mt-1 text-xs text-neutral-600">
        {query && style !== "All"
          ? `No results for "${query}" with style "${style}"`
          : query
          ? `No results for "${query}"`
          : `No trips with style "${style}"`}
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TripsPage() {
  const [trips, setTrips]       = useState<TripSummary[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [query, setQuery]       = useState("");
  const [styleFilter, setStyle] = useState("All");
  const [sortBy, setSortBy]     = useState<SortOption>("latest");

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

  // ── Client-side filter + sort ───────────────────────────────────────────────
  const filtered = useMemo(() => {
    const result = trips.filter((trip) => {
      const matchQuery =
        query.trim() === "" ||
        trip.destination.toLowerCase().includes(query.toLowerCase().trim());

      const matchStyle =
        styleFilter === "All" ||
        (trip.travel_style ?? "").toLowerCase() === styleFilter.toLowerCase();

      return matchQuery && matchStyle;
    });

    return result.sort((a, b) => {
      if (sortBy === "latest")         return b.id - a.id;
      if (sortBy === "oldest")         return a.id - b.id;
      if (sortBy === "highest_budget") return b.budget - a.budget;
      return 0;
    });
  }, [trips, query, styleFilter, sortBy]);

  const hasActiveFilter = query.trim() !== "" || styleFilter !== "All" || sortBy !== "latest";

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

        {/* Search + filter bar */}
        {!loading && trips.length > 0 && (
          <div className="flex flex-col gap-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <SearchBar value={query} onChange={setQuery} />
              </div>
              <SortDropdown value={sortBy} onChange={setSortBy} />
              {/* Result count */}
              <span className="shrink-0 text-xs text-neutral-600 tabular-nums">
                {filtered.length} / {trips.length}
              </span>
            </div>
            <StyleFilter value={styleFilter} onChange={setStyle} />
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Loading trips…
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-xs text-red-400 bg-red-950/40 border border-red-900/50 rounded-xl px-4 py-3">
            {error}
          </p>
        )}

        {/* Empty — no trips at all */}
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

        {/* Empty — filter found nothing */}
        {!loading && trips.length > 0 && filtered.length === 0 && (
          <EmptySearch query={query} style={styleFilter} />
        )}

        {/* Trip grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((trip) => (
              <TripCard key={trip.id} trip={trip} onDelete={handleDelete} />
            ))}
          </div>
        )}

        {/* Active filter — reset hint */}
        {!loading && hasActiveFilter && filtered.length > 0 && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => { setQuery(""); setStyle("All"); setSortBy("latest"); }}
              className="text-xs text-neutral-600 hover:text-neutral-400 transition"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
