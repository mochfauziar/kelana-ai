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

// ─── Confirmation Dialog ──────────────────────────────────────────────────────

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
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-neutral-950/80 backdrop-blur-sm"
      onClick={onCancel}
    >
      {/* Panel */}
      <div
        className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl p-6 flex flex-col gap-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div className="flex items-center justify-center h-11 w-11 rounded-full bg-red-950/50 border border-red-900/50">
          <span className="text-red-400 text-lg">⚠</span>
        </div>

        {/* Text */}
        <div>
          <h3 className="text-base font-semibold text-white leading-snug">
            Delete this trip?
          </h3>
          <p className="mt-1.5 text-xs text-neutral-500 leading-relaxed">
            <span className="text-neutral-300 font-medium">{destination}</span>{" "}
            will be permanently removed. This action cannot be undone.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-neutral-800 hover:border-neutral-600 text-xs font-semibold uppercase tracking-widest text-neutral-400 hover:text-white py-2.5 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-semibold uppercase tracking-widest text-white py-2.5 transition"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface TripCardProps {
  trip: TripSummary;
  onDelete?: (id: number) => void;
}

export default function TripCard({ trip, onDelete }: TripCardProps) {
  const [confirming, setConfirming] = useState(false);

  function handleDeleteClick() {
    setConfirming(true);
  }

  function handleConfirm() {
    setConfirming(false);
    onDelete?.(trip.id);
  }

  function handleCancel() {
    setConfirming(false);
  }

  return (
    <>
      {/* Confirmation dialog — rendered outside card flow */}
      {confirming && (
        <ConfirmDialog
          destination={trip.destination}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}

      <div className="group flex flex-col gap-4 p-5 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500 mb-0.5">
              Trip #{trip.id}
            </p>
            <h2 className="text-lg font-bold text-white leading-tight">
              {trip.destination}
            </h2>
          </div>
          <span className="shrink-0 text-xs font-semibold uppercase tracking-widest text-emerald-400 bg-emerald-950/50 border border-emerald-900/60 px-2.5 py-1 rounded-full">
            {trip.category}
          </span>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Budget", value: formatCurrency(trip.budget) },
            { label: "Daily", value: formatCurrency(trip.daily_budget) },
            { label: "Days", value: `${trip.days}d` },
          ].map((s) => (
            <div
              key={s.label}
              className="flex flex-col gap-0.5 bg-neutral-950/60 rounded-xl px-3 py-2"
            >
              <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-600">
                {s.label}
              </span>
              <span className="text-sm font-semibold text-white">{s.value}</span>
            </div>
          ))}
        </div>

        {/* AI snippet */}
        {trip.ai_recommendation && (
          <p className="text-xs text-neutral-500 leading-relaxed line-clamp-2">
            {trip.ai_recommendation}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-1">
          <Link
            href={`/trips/${trip.id}`}
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition"
          >
            View details →
          </Link>
          {onDelete && (
            <button
              onClick={handleDeleteClick}
              className="text-xs font-semibold text-neutral-600 hover:text-red-400 transition"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </>
  );
}
