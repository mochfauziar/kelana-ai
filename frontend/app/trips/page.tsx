"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { listTrips, deleteTrip, type TripSummary } from "@/services/tripServices";
import TripCard from "@/components/TripCard";
import { useAuthGuard } from "@/lib/useAuthGuard";

const TRAVEL_STYLES = ["All", "Budget", "Standard", "Luxury"];

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
      <svg
        className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none"
        style={{ color: "var(--text-muted)" }}
        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="8" />
        <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
      </svg>
      <input
        type="text"
        placeholder="Search destination…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl pl-9 pr-10 py-2.5 text-sm outline-none transition"
        style={{
          background: "var(--bg-surface)",
          border:     "1px solid var(--border)",
          color:      "var(--text-primary)",
        }}
        onFocus={(e)  => (e.currentTarget.style.borderColor = "var(--accent)")}
        onBlur={(e)   => (e.currentTarget.style.borderColor = "var(--border)")}
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 transition"
          style={{ color: "var(--text-muted)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
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
    <div className="flex items-center gap-2 flex-wrap" role="group" aria-label="Filter by travel style">
      {TRAVEL_STYLES.map((style) => (
        <button
          key={style}
          onClick={() => onChange(style)}
          className="text-xs font-semibold px-3 py-1.5 rounded-full border transition"
          style={
            value === style
              ? { background: "var(--accent)", borderColor: "var(--accent)", color: "#0c0f0d" }
              : { background: "transparent", borderColor: "var(--border)", color: "var(--text-muted)" }
          }
          onMouseEnter={(e) => {
            if (value !== style) e.currentTarget.style.color = "var(--text-primary)";
          }}
          onMouseLeave={(e) => {
            if (value !== style) e.currentTarget.style.color = "var(--text-muted)";
          }}
          aria-pressed={value === style}
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
        className="appearance-none text-xs font-semibold rounded-xl pl-3 pr-8 py-2.5 outline-none cursor-pointer transition"
        style={{
          background: "var(--bg-surface)",
          border:     "1px solid var(--border)",
          color:      "var(--text-secondary)",
        }}
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <svg
        className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none"
        style={{ color: "var(--text-muted)" }}
        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────

/**
 * Pulsing placeholder that mirrors the real TripCard proportions.
 * Shown while trips are loading.
 */
function SkeletonCard() {
  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      aria-hidden="true"
    >
      {/* Thumbnail placeholder */}
      <div
        className="h-36 animate-pulse"
        style={{ background: "var(--bg-elevated)" }}
      />
      {/* Body placeholder */}
      <div className="flex flex-col gap-3 p-4">
        {/* Badge */}
        <div
          className="h-5 w-16 rounded-full animate-pulse"
          style={{ background: "var(--bg-elevated)" }}
        />
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-12 rounded-xl animate-pulse"
              style={{ background: "var(--bg-elevated)" }}
            />
          ))}
        </div>
        {/* Summary line */}
        <div
          className="h-3 w-3/4 rounded animate-pulse"
          style={{ background: "var(--bg-elevated)" }}
        />
        {/* Actions row */}
        <div className="flex items-center justify-between pt-1">
          <div
            className="h-3 w-20 rounded animate-pulse"
            style={{ background: "var(--bg-elevated)" }}
          />
          <div
            className="h-3 w-10 rounded animate-pulse"
            style={{ background: "var(--bg-elevated)" }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Empty State (no trips at all) ────────────────────────────────────────────

function EmptyTrips() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      {/* Route-pin SVG illustration */}
      <svg
        width="64" height="64" viewBox="0 0 64 64" fill="none"
        className="mb-6 opacity-40"
        aria-hidden="true"
      >
        <circle cx="32" cy="32" r="31" stroke="var(--border)" strokeWidth="1.5" />
        <path
          d="M32 14C25.373 14 20 19.373 20 26c0 9.941 12 24 12 24s12-14.059 12-24c0-6.627-5.373-12-12-12z"
          stroke="var(--accent)" strokeWidth="1.5" fill="none"
        />
        <circle cx="32" cy="26" r="4" stroke="var(--accent)" strokeWidth="1.5" fill="none" />
        {/* small route dots */}
        <circle cx="20" cy="46" r="2" fill="var(--accent)" fillOpacity="0.4" />
        <circle cx="32" cy="50" r="2" fill="var(--accent)" fillOpacity="0.6" />
        <circle cx="44" cy="46" r="2" fill="var(--accent)" fillOpacity="0.4" />
        <path
          d="M20 46 Q26 42 32 50 Q38 42 44 46"
          stroke="var(--accent)" strokeWidth="1" strokeOpacity="0.4"
          fill="none" strokeLinecap="round"
        />
      </svg>

      <h2
        className="text-lg font-bold tracking-tight"
        style={{ color: "var(--text-primary)" }}
      >
        No trips yet
      </h2>
      <p
        className="mt-2 text-sm max-w-xs leading-relaxed"
        style={{ color: "var(--text-secondary)" }}
      >
        Your saved trips will appear here. Let the AI plan your next adventure.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-widest transition"
        style={{ background: "var(--accent)", color: "#0c0f0d" }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
        Plan your first trip
      </Link>
    </div>
  );
}

// ─── Empty Search State ───────────────────────────────────────────────────────

function EmptySearch({ query, style }: { query: string; style: string }) {
  return (
    <div className="text-center py-20">
      <p className="text-2xl mb-3" aria-hidden="true">🔍</p>
      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
        No trips match this filter
      </p>
      <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
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
  const { ready } = useAuthGuard();

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
    if (ready) fetchTrips();
  }, [ready]);

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

  // Result count label — clear about what the numbers mean
  const countLabel =
    filtered.length === trips.length
      ? `${trips.length} trip${trips.length !== 1 ? "s" : ""}`
      : `Showing ${filtered.length} of ${trips.length} trip${trips.length !== 1 ? "s" : ""}`;

  if (!ready) return null;

  return (
    <main
      className="min-h-screen text-white flex flex-col"
      style={{ background: "var(--bg-base)" }}
    >
      {/* Header */}
      <header
        className="px-6 py-4 flex items-center justify-between"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-3">
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: "var(--accent)" }}
            aria-hidden="true"
          />
          <Link
            href="/"
            className="text-sm font-semibold tracking-widest uppercase transition"
            style={{ color: "var(--text-secondary)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
          >
            Kelana<span style={{ color: "var(--accent)" }}>AI</span>
          </Link>
        </div>
        <Link
          href="/"
          className="text-xs font-semibold uppercase tracking-widest rounded-xl px-4 py-2 transition"
          style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color        = "var(--text-primary)";
            e.currentTarget.style.borderColor  = "var(--text-muted)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color        = "var(--text-muted)";
            e.currentTarget.style.borderColor  = "var(--border)";
          }}
        >
          + New Trip
        </Link>
      </header>

      <div className="flex-1 px-4 py-12 max-w-4xl mx-auto w-full">
        {/* Page title */}
        <div className="mb-8">
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Your Trips
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            All saved trip plans in one place.
          </p>
        </div>

        {/* Search + filter bar — only shown once loaded and trips exist */}
        {!loading && trips.length > 0 && (
          <div className="flex flex-col gap-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <SearchBar value={query} onChange={setQuery} />
              </div>
              <SortDropdown value={sortBy} onChange={setSortBy} />
              {/* Clear, unambiguous count label */}
              <span
                className="shrink-0 text-xs tabular-nums"
                style={{ color: "var(--text-muted)" }}
                aria-live="polite"
                aria-atomic="true"
              >
                {countLabel}
              </span>
            </div>
            <StyleFilter value={styleFilter} onChange={setStyle} />
          </div>
        )}

        {/* ── Loading: skeleton grid ── */}
        {loading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading trips…">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* ── Error ── */}
        {!loading && error && (
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

        {/* ── Empty — no trips at all ── */}
        {!loading && !error && trips.length === 0 && <EmptyTrips />}

        {/* ── Empty — filter/search found nothing ── */}
        {!loading && trips.length > 0 && filtered.length === 0 && (
          <EmptySearch query={query} style={styleFilter} />
        )}

        {/* ── Trip grid ── */}
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
              onClick={() => {
                setQuery("");
                setStyle("All");
                setSortBy("latest");
              }}
              className="text-xs transition"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
