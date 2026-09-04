"use client";

import { useState } from "react";
import Link from "next/link";
import { type TripSummary } from "@/services/tripServices";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

// ─── Category badge colour ────────────────────────────────────────────────────

function categoryStyle(category: string): { bg: string; color: string; border: string } {
  const map: Record<string, { bg: string; color: string; border: string }> = {
    Backpacker: { bg: "rgba(234,179,8,0.12)",  color: "#eab308", border: "rgba(234,179,8,0.3)" },
    Budget:     { bg: "rgba(234,179,8,0.12)",  color: "#eab308", border: "rgba(234,179,8,0.3)" },
    Standard:   { bg: "rgba(86,171,124,0.12)", color: "#56AB7C", border: "rgba(86,171,124,0.3)" },
    Comfort:    { bg: "rgba(99,102,241,0.12)", color: "#818cf8", border: "rgba(99,102,241,0.3)" },
    Luxury:     { bg: "rgba(236,72,153,0.12)", color: "#f472b6", border: "rgba(236,72,153,0.3)" },
    Family:     { bg: "rgba(251,146,60,0.12)", color: "#fb923c", border: "rgba(251,146,60,0.3)" },
  };
  return map[category] ?? { bg: "rgba(86,171,124,0.12)", color: "#56AB7C", border: "rgba(86,171,124,0.3)" };
}

// ─── Destination colour (for letter badge fallback) ───────────────────────────

/** Deterministic hue from destination string so each card gets a consistent colour. */
function destinationHue(destination: string): number {
  let hash = 0;
  for (let i = 0; i < destination.length; i++) {
    hash = destination.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}

// ─── TripThumbnail ────────────────────────────────────────────────────────────

/**
 * Reusable destination thumbnail.
 *
 * Tries to load a photo from Unsplash Source keyed by destination name.
 * On error (blocked, slow, or unavailable) falls back to a coloured gradient
 * panel with the destination's first letter — never a generic emoji.
 *
 * To swap the image source later, only this component needs to change.
 */
export function TripThumbnail({
  destination,
  className = "",
}: {
  destination: string;
  className?: string;
}) {
  const [imgError, setImgError] = useState(false);

  const keyword  = encodeURIComponent(destination.trim().split(",")[0]);
  const src      = `https://source.unsplash.com/400x200/?${keyword},travel,landmark`;
  const letter   = destination.trim()[0]?.toUpperCase() ?? "?";
  const hue      = destinationHue(destination);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!imgError ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={`${destination} destination photo`}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={() => setImgError(true)}
        />
      ) : (
        /* ── Letter badge fallback — no generic emoji ── */
        <div
          className="w-full h-full flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg,
              hsl(${hue},35%,14%) 0%,
              hsl(${hue},28%,10%) 100%)`,
          }}
          aria-hidden="true"
        >
          {/* SVG pin icon consistent with route-map illustration style */}
          <svg
            width="32" height="32" viewBox="0 0 32 32" fill="none"
            className="absolute opacity-10"
            aria-hidden="true"
          >
            <path
              d="M16 3C11.582 3 8 6.582 8 11c0 6.627 8 18 8 18s8-11.373 8-18c0-4.418-3.582-8-8-8z"
              stroke={`hsl(${hue},60%,65%)`} strokeWidth="1.5" fill="none"
            />
            <circle cx="16" cy="11" r="3" stroke={`hsl(${hue},60%,65%)`} strokeWidth="1.5" fill="none" />
          </svg>
          {/* Large initial letter */}
          <span
            className="relative text-4xl font-bold tracking-tight select-none"
            style={{ color: `hsl(${hue},55%,65%)` }}
          >
            {letter}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

function ConfirmDialog({
  destination,
  onConfirm,
  onCancel,
}: {
  destination: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-sm"
      style={{ background: "rgba(13,13,13,0.85)" }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6 flex flex-col gap-5 shadow-2xl"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-center h-11 w-11 rounded-full"
          style={{ background: "rgba(127,29,29,0.4)", border: "1px solid rgba(127,29,29,0.5)" }}
        >
          <span className="text-red-400 text-lg" aria-hidden="true">⚠</span>
        </div>
        <div>
          <h3 className="text-base font-semibold leading-snug">Delete this trip?</h3>
          <p className="mt-1.5 text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            <span style={{ color: "var(--text-primary)" }} className="font-medium">
              {destination}
            </span>{" "}
            will be permanently removed. This cannot be undone.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl py-2.5 text-xs font-semibold uppercase tracking-widest transition"
            style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-xl py-2.5 text-xs font-semibold uppercase tracking-widest text-white transition"
            style={{ background: "#dc2626" }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── TripCard ─────────────────────────────────────────────────────────────────

interface TripCardProps {
  trip: TripSummary;
  onDelete?: (id: number) => void;
}

/**
 * Card for a single saved trip.
 *
 * The entire card surface is a navigation link to the trip detail page.
 * The Delete button calls stopPropagation so it doesn't trigger navigation.
 */
export default function TripCard({ trip, onDelete }: TripCardProps) {
  const [confirming, setConfirming] = useState(false);

  const catStyle = categoryStyle(trip.category);

  /**
   * Display text priority:
   *   1. trip.summary  — AI-generated one-liner (new field)
   *   2. Derived clean fallback — "{N} days · {travel_style}"
   * Never shows raw itinerary markdown.
   */
  const displaySummary =
    trip.summary?.trim() ||
    `${trip.days} day${trip.days === 1 ? "" : "s"} · ${trip.travel_style ?? trip.category} travel`;

  return (
    <>
      {confirming && (
        <ConfirmDialog
          destination={trip.destination}
          onConfirm={() => {
            setConfirming(false);
            onDelete?.(trip.id);
          }}
          onCancel={() => setConfirming(false)}
        />
      )}

      {/*
       * The outer Link makes the whole card clickable and navigable.
       * We use `group` for the hover thumbnail zoom effect.
       * `block` so it fills the grid cell.
       */}
      <Link
        href={`/trips/${trip.id}`}
        className="group block rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]"
        style={{
          background:  "var(--bg-surface)",
          border:      "1px solid var(--border)",
          boxShadow:   "0 0 0 0 transparent",
          textDecoration: "none",
          color: "inherit",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.4)")}
        onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 0 0 0 transparent")}
        aria-label={`View trip to ${trip.destination}`}
      >
        {/* Thumbnail */}
        <div className="relative h-36" style={{ background: "var(--bg-elevated)" }}>
          <TripThumbnail destination={trip.destination} className="h-36" />

          {/* Gradient overlay so text stays readable */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(to top, rgba(26,26,26,0.88) 0%, transparent 60%)",
            }}
            aria-hidden="true"
          />

          {/* Destination name overlay */}
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-3">
            <p
              className="text-[10px] font-semibold uppercase tracking-widest mb-0.5"
              style={{ color: "rgba(240,240,240,0.5)" }}
            >
              Trip #{trip.id}
            </p>
            <h2 className="text-base font-bold leading-tight text-white drop-shadow">
              {trip.destination}
            </h2>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-3 p-4">
          {/* Category badge */}
          <div>
            <span
              className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{
                background: catStyle.bg,
                color:      catStyle.color,
                border:     `1px solid ${catStyle.border}`,
              }}
            >
              {trip.category}
            </span>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Budget", value: formatCurrency(trip.budget) },
              { label: "Daily",  value: formatCurrency(trip.daily_budget) },
              { label: "Days",   value: `${trip.days}d` },
            ].map((s) => (
              <div
                key={s.label}
                className="flex flex-col gap-0.5 rounded-xl px-3 py-2"
                style={{ background: "var(--bg-elevated)" }}
              >
                <span
                  className="text-[10px] font-semibold uppercase tracking-widest"
                  style={{ color: "var(--text-muted)" }}
                >
                  {s.label}
                </span>
                <span className="text-sm font-semibold">{s.value}</span>
              </div>
            ))}
          </div>

          {/* Clean one-line summary — never raw itinerary text */}
          <p
            className="text-xs leading-relaxed line-clamp-2"
            style={{ color: "var(--text-secondary)" }}
          >
            {displaySummary}
          </p>

          {/* Actions row */}
          <div className="flex items-center justify-between pt-1">
            {/* Visual affordance — navigation is already handled by the outer Link */}
            <span
              className="text-xs font-semibold pointer-events-none"
              style={{ color: "var(--accent)" }}
              aria-hidden="true"
            >
              View details →
            </span>

            {onDelete && (
              <button
                onClick={(e) => {
                  // Prevent the outer Link from firing
                  e.preventDefault();
                  e.stopPropagation();
                  setConfirming(true);
                }}
                className="text-xs font-semibold transition"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#f87171")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                aria-label={`Delete trip to ${trip.destination}`}
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </Link>
    </>
  );
}
